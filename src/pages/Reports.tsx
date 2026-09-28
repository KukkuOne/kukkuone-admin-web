import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, DatePicker, Empty, Row, Select, Space, Table, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../lib/api';
import { batchColor, capColor, money } from '../lib/format';

const { RangePicker } = DatePicker;

/** Slice colors for the "Batches by status" donut, roughly matching batchColor. */
const STATUS_HEX: Record<string, string> = {
  ACTIVE: '#16a34a',
  READY_FOR_HARVEST: '#d97706',
  CLOSED: '#9ca3af',
  SOLD: '#2563eb',
  SETTLED: '#4f46e5',
};

function statusHex(status: string): string {
  return STATUS_HEX[status] ?? '#6b7280';
}

interface StatusDatum {
  status: string;
  count: number;
}

interface OrgProfitDatum {
  org: string;
  profit: number;
}

interface OrgExpRevDatum {
  org: string;
  expenses: number;
  revenue: number;
}

/** Format a rupee (major-unit) number for chart tooltips. */
function rupeeLabel(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

interface ReportBatchRow {
  id: string;
  org: string;
  farm: string;
  shed: string;
  breed: string;
  status: string;
  initialBirds: number;
  currentBirds: number;
  mortality: number;
  culls: number;
  birdsSold: number;
  mortalityPct: number;
  totalExpensesMinor: number;
  totalRevenueMinor: number;
  profitMinor: number;
  costPerBirdMinor: number | null;
  revenuePerBirdMinor: number | null;
  profitPerBirdMinor: number | null;
  placementDate: string;
}

interface FinancialRow {
  orgId: string;
  org: string;
  capabilities: string[];
  batches: number;
  totalExpensesMinor: number;
  totalRevenueMinor: number;
  profitMinor: number;
}

interface OrgOption {
  id: string;
  name: string;
}

const STATUSES = [
  'PLANNED',
  'PLACED',
  'ACTIVE',
  'READY_FOR_HARVEST',
  'HARVESTING',
  'SOLD',
  'SETTLEMENT_PENDING',
  'SETTLED',
  'CLOSED',
];

/** Convert integer minor units to a plain rupee number string with 2 decimals. */
function rupees(minor: number | null | undefined): string {
  return minor == null ? '' : (minor / 100).toFixed(2);
}

function profitStyle(minor: number): CSSProperties {
  if (minor < 0) return { color: '#cf1322' };
  if (minor > 0) return { color: '#3f8600' };
  return {};
}

/** Build a CSV string, quoting fields that contain commas, quotes, or newlines. */
function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (field: string | number): string => {
    const s = String(field);
    if (/[",\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers, ...rows].map((row) => row.map(escape).join(','));
  return lines.join('\r\n');
}

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [status, setStatus] = useState<string | undefined>();
  const [orgId, setOrgId] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const from = range?.[0] ?? null;
  const to = range?.[1] ?? null;

  const orgs = useQuery({
    queryKey: ['report-orgs'],
    queryFn: () => api.get<OrgOption[]>('/admin/organizations'),
  });

  const fromIso = from ? from.startOf('day').toISOString() : undefined;
  const toIso = to ? to.endOf('day').toISOString() : undefined;

  const batches = useQuery({
    queryKey: ['report-batches', status, orgId, fromIso, toIso],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (orgId) params.set('orgId', orgId);
      if (fromIso) params.set('from', fromIso);
      if (toIso) params.set('to', toIso);
      const qs = params.toString();
      return api.get<ReportBatchRow[]>(`/admin/reports/batches${qs ? `?${qs}` : ''}`);
    },
  });

  const financials = useQuery({
    queryKey: ['report-financials'],
    queryFn: () => api.get<FinancialRow[]>('/admin/reports/financials'),
  });

  const batchData = batches.data ?? [];
  const financialData = financials.data ?? [];

  const statusChartData = useMemo<StatusDatum[]>(() => {
    const counts = new Map<string, number>();
    for (const row of batchData) {
      counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    }
    return Array.from(counts, ([status, count]) => ({ status, count }));
  }, [batchData]);

  const profitChartData = useMemo<OrgProfitDatum[]>(
    () => financialData.map((r) => ({ org: r.org, profit: r.profitMinor / 100 })),
    [financialData],
  );

  const expRevChartData = useMemo<OrgExpRevDatum[]>(
    () =>
      financialData.map((r) => ({
        org: r.org,
        expenses: r.totalExpensesMinor / 100,
        revenue: r.totalRevenueMinor / 100,
      })),
    [financialData],
  );

  const downloadBatches = () => {
    const headers = [
      'Organization',
      'Farm',
      'Shed',
      'Breed',
      'Status',
      'Initial Birds',
      'Current Birds',
      'Mortality %',
      'Expenses (₹)',
      'Revenue (₹)',
      'Profit (₹)',
      'Cost/bird (₹)',
      'Revenue/bird (₹)',
      'Profit/bird (₹)',
    ];
    const rows = batchData.map((r) => [
      r.org,
      r.farm,
      r.shed,
      r.breed,
      r.status,
      r.initialBirds,
      r.currentBirds,
      r.mortalityPct,
      rupees(r.totalExpensesMinor),
      rupees(r.totalRevenueMinor),
      rupees(r.profitMinor),
      rupees(r.costPerBirdMinor),
      rupees(r.revenuePerBirdMinor),
      rupees(r.profitPerBirdMinor),
    ]);
    downloadCsv('batch-performance.csv', toCsv(headers, rows));
  };

  const downloadFinancials = () => {
    const headers = [
      'Organization',
      'Capabilities',
      'Batches',
      'Expenses (₹)',
      'Revenue (₹)',
      'Profit (₹)',
    ];
    const rows = financialData.map((r) => [
      r.org,
      r.capabilities.join('|'),
      r.batches,
      rupees(r.totalExpensesMinor),
      rupees(r.totalRevenueMinor),
      rupees(r.profitMinor),
    ]);
    downloadCsv('financials-by-org.csv', toCsv(headers, rows));
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card title="Charts">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', marginBottom: 8, fontWeight: 500 }}>
              Batches by status
            </div>
            {batches.isLoading || statusChartData.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No batch data" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={50}
                    outerRadius={80}
                  >
                    {statusChartData.map((d) => (
                      <Cell key={d.status} fill={statusHex(d.status)} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Col>

          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', marginBottom: 8, fontWeight: 500 }}>
              Profit by organization
            </div>
            {financials.isLoading || profitChartData.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No financial data" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={profitChartData} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="org"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={60}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: number) => rupeeLabel(value)} />
                  <Bar dataKey="profit" name="Profit" fill="#c2410c" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Col>

          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', marginBottom: 8, fontWeight: 500 }}>
              Expenses vs Revenue by org
            </div>
            {financials.isLoading || expRevChartData.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No financial data" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={expRevChartData} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="org"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={60}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: number) => rupeeLabel(value)} />
                  <Legend />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
                  <Bar dataKey="revenue" name="Revenue" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Col>
        </Row>
      </Card>

      <Card
        title="Batch performance"
        extra={
          <Button
            icon={<DownloadOutlined />}
            onClick={downloadBatches}
            disabled={batchData.length === 0}
          >
            Download CSV
          </Button>
        }
      >
        <Space size={12} wrap style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Filter by status"
            style={{ width: 220 }}
            value={status}
            onChange={setStatus}
            options={STATUSES.map((s) => ({ value: s, label: s }))}
          />
          <Select
            allowClear
            placeholder="Filter by organization"
            style={{ width: 260 }}
            value={orgId}
            onChange={setOrgId}
            loading={orgs.isLoading}
            options={(orgs.data ?? []).map((o) => ({ value: o.id, label: o.name }))}
          />
          <RangePicker
            value={range ?? undefined}
            onChange={(vals) => setRange(vals as [Dayjs | null, Dayjs | null] | null)}
          />
        </Space>
        {batches.error && (
          <Alert
            type="error"
            message={(batches.error as Error).message}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Table
          rowKey="id"
          loading={batches.isLoading}
          dataSource={batchData}
          scroll={{ x: 'max-content' }}
          columns={[
            { title: 'Organization', dataIndex: 'org' },
            { title: 'Farm', dataIndex: 'farm' },
            { title: 'Breed', dataIndex: 'breed' },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (s: string) => <Tag color={batchColor(s)}>{s}</Tag>,
            },
            { title: 'Initial', dataIndex: 'initialBirds' },
            { title: 'Current', dataIndex: 'currentBirds' },
            {
              title: 'Mortality %',
              dataIndex: 'mortalityPct',
              render: (v: number) => `${v}%`,
            },
            {
              title: 'Expenses',
              dataIndex: 'totalExpensesMinor',
              render: (v: number) => money(v),
            },
            {
              title: 'Revenue',
              dataIndex: 'totalRevenueMinor',
              render: (v: number) => money(v),
            },
            {
              title: 'Profit',
              dataIndex: 'profitMinor',
              render: (v: number) => <span style={profitStyle(v)}>{money(v)}</span>,
            },
            {
              title: 'Cost/bird',
              dataIndex: 'costPerBirdMinor',
              render: (v: number | null) => (v == null ? '—' : money(v)),
            },
            {
              title: 'Profit/bird',
              dataIndex: 'profitPerBirdMinor',
              render: (v: number | null) => (v == null ? '—' : money(v)),
            },
          ]}
        />
      </Card>

      <Card
        title="Financials by organization"
        extra={
          <Button
            icon={<DownloadOutlined />}
            onClick={downloadFinancials}
            disabled={financialData.length === 0}
          >
            Download CSV
          </Button>
        }
      >
        {financials.error && (
          <Alert
            type="error"
            message={(financials.error as Error).message}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Table
          rowKey="orgId"
          loading={financials.isLoading}
          dataSource={financialData}
          scroll={{ x: 'max-content' }}
          columns={[
            { title: 'Organization', dataIndex: 'org' },
            {
              title: 'Capabilities',
              dataIndex: 'capabilities',
              render: (caps: string[]) => (
                <Space size={4} wrap>
                  {caps.map((c) => (
                    <Tag key={c} color={capColor(c)}>
                      {c}
                    </Tag>
                  ))}
                </Space>
              ),
            },
            { title: 'Batches', dataIndex: 'batches' },
            {
              title: 'Expenses',
              dataIndex: 'totalExpensesMinor',
              render: (v: number) => money(v),
            },
            {
              title: 'Revenue',
              dataIndex: 'totalRevenueMinor',
              render: (v: number) => money(v),
            },
            {
              title: 'Profit',
              dataIndex: 'profitMinor',
              render: (v: number) => <span style={profitStyle(v)}>{money(v)}</span>,
            },
          ]}
        />
      </Card>
    </Space>
  );
}
