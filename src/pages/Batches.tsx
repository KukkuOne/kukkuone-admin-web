import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Col, Descriptions, Drawer, Row, Select, Statistic, Table, Tag } from 'antd';
import { useState } from 'react';
import { api } from '../lib/api';
import { batchColor, date, kg, money } from '../lib/format';

interface BatchRow {
  id: string;
  org: string;
  farm: string;
  shed: string;
  breed: string;
  status: string;
  initialBirds: number;
  mortality: number;
  culls: number;
  createdAt: string;
}

interface BatchDetail extends BatchRow {
  placementDate: string;
  targetHarvestDate: string | null;
  summary: {
    currentBirds: number;
    mortalityPct: number;
    latestAvgWeightG: number | null;
    totalLiveWeightKg: number | null;
    totalFeedKg: number;
    fcr: number | null;
    totalExpensesMinor: number;
  };
  dailyLogs: Array<{
    id: string;
    date: string;
    openingBirds: number;
    mortality: number;
    culls: number;
    closingBirds: number;
    avgWeight: number | null;
    feedConsumed: number | null;
  }>;
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

export default function Batches() {
  const [status, setStatus] = useState<string | undefined>();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['batches', status],
    queryFn: () => api.get<BatchRow[]>(`/admin/batches${status ? `?status=${status}` : ''}`),
  });

  const detail = useQuery({
    queryKey: ['batch', openId],
    queryFn: () => api.get<BatchDetail>(`/admin/batches/${openId}`),
    enabled: !!openId,
  });

  return (
    <Card
      title="Batches"
      extra={
        <Select
          allowClear
          placeholder="Filter by status"
          style={{ width: 220 }}
          value={status}
          onChange={setStatus}
          options={STATUSES.map((s) => ({ value: s, label: s }))}
        />
      }
    >
      {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        onRow={(r) => ({ onClick: () => setOpenId(r.id), style: { cursor: 'pointer' } })}
        columns={[
          { title: 'Organization', dataIndex: 'org' },
          { title: 'Farm', dataIndex: 'farm' },
          { title: 'Shed', dataIndex: 'shed' },
          { title: 'Breed', dataIndex: 'breed' },
          { title: 'Birds', dataIndex: 'initialBirds' },
          { title: 'Mortality', dataIndex: 'mortality' },
          { title: 'Culls', dataIndex: 'culls' },
          { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={batchColor(s)}>{s}</Tag> },
          { title: 'Created', dataIndex: 'createdAt', render: (d: string) => date(d) },
        ]}
      />

      <Drawer
        title={detail.data ? `${detail.data.breed} · ${detail.data.farm}` : 'Batch'}
        width={640}
        open={!!openId}
        onClose={() => setOpenId(null)}
        loading={detail.isLoading}
      >
        {detail.data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="Organization">{detail.data.org}</Descriptions.Item>
              <Descriptions.Item label="Shed">{detail.data.shed}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={batchColor(detail.data.status)}>{detail.data.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Placed">{date(detail.data.placementDate)}</Descriptions.Item>
              <Descriptions.Item label="Initial birds">{detail.data.initialBirds}</Descriptions.Item>
              <Descriptions.Item label="Target harvest">{date(detail.data.targetHarvestDate)}</Descriptions.Item>
            </Descriptions>

            <Row gutter={12}>
              <Col span={8}><Card size="small"><Statistic title="Current birds" value={detail.data.summary.currentBirds} /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title="Mortality %" value={detail.data.summary.mortalityPct} suffix="%" /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title="FCR" value={detail.data.summary.fcr ?? '—'} /></Card></Col>
              <Col span={8}><Card size="small" style={{ marginTop: 12 }}><Statistic title="Avg weight" value={kg(detail.data.summary.latestAvgWeightG)} /></Card></Col>
              <Col span={8}><Card size="small" style={{ marginTop: 12 }}><Statistic title="Live weight" value={detail.data.summary.totalLiveWeightKg ?? 0} suffix="kg" /></Card></Col>
              <Col span={8}><Card size="small" style={{ marginTop: 12 }}><Statistic title="Expenses" value={money(detail.data.summary.totalExpensesMinor)} /></Card></Col>
            </Row>

            <Card size="small" title="Daily logs">
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={detail.data.dailyLogs}
                columns={[
                  { title: 'Date', dataIndex: 'date', render: (d: string) => date(d) },
                  { title: 'Open', dataIndex: 'openingBirds' },
                  { title: 'Mort.', dataIndex: 'mortality' },
                  { title: 'Culls', dataIndex: 'culls' },
                  { title: 'Close', dataIndex: 'closingBirds' },
                  { title: 'Avg wt', dataIndex: 'avgWeight', render: (g: number | null) => kg(g) },
                  { title: 'Feed', dataIndex: 'feedConsumed', render: (g: number | null) => kg(g) },
                ]}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </Card>
  );
}
