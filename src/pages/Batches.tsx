import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Col, Descriptions, Drawer, Row, Select, Statistic, Table, Tag } from 'antd';
import { label, useT } from '../i18n';
import { api } from '../lib/api';
import { useParam } from '../lib/useParam';
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
  const t = useT();
  const [status, setStatus] = useParam('status');
  const [orgId, setOrgId] = useParam('org');
  const [openId, setOpenId] = useParam('batch');
  const qs = new URLSearchParams({ ...(status ? { status } : {}), ...(orgId ? { orgId } : {}) }).toString();

  const { data, isLoading, error } = useQuery({
    queryKey: ['batches', status, orgId],
    queryFn: () => api.get<BatchRow[]>(`/admin/batches${qs ? `?${qs}` : ''}`),
  });

  const detail = useQuery({
    queryKey: ['batch', openId],
    queryFn: () => api.get<BatchDetail>(`/admin/batches/${openId}`),
    enabled: !!openId,
  });

  return (
    <Card
      title={t.navBatches}
      extra={
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {orgId && (
          <Tag closable onClose={() => setOrgId(undefined)} closeIcon={<span aria-label={t.batchShowAllOrgs}>×</span>}>
            {data?.[0]?.org ?? t.batchOneOrg}
          </Tag>
        )}
        <Select
          allowClear
          placeholder={t.filterByStatus}
          style={{ width: 220 }}
          value={status}
          onChange={setStatus}
          options={STATUSES.map((s) => ({ value: s, label: label(t.batchStatus, s) }))}
        />
        </span>
      }
    >
      {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        onRow={(r) => ({ onClick: () => setOpenId(r.id), style: { cursor: 'pointer' } })}
        columns={[
          { title: t.colOrg, dataIndex: 'org' },
          { title: t.colFarm, dataIndex: 'farm' },
          { title: t.colShed, dataIndex: 'shed' },
          { title: t.colBreed, dataIndex: 'breed' },
          { title: t.colBirds, dataIndex: 'initialBirds' },
          { title: t.colMortality, dataIndex: 'mortality' },
          { title: t.colCulls, dataIndex: 'culls' },
          { title: t.colStatus, dataIndex: 'status', render: (s: string) => <Tag color={batchColor(s)}>{label(t.batchStatus, s)}</Tag> },
          { title: t.colCreated, dataIndex: 'createdAt', render: (d: string) => date(d) },
        ]}
      />

      <Drawer
        title={detail.data ? `${detail.data.breed} · ${detail.data.farm}` : t.batchDrawerFallback}
        width={640}
        open={!!openId}
        onClose={() => setOpenId(undefined)}
        loading={detail.isLoading}
      >
        {detail.data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label={t.colOrg}>{detail.data.org}</Descriptions.Item>
              <Descriptions.Item label={t.colShed}>{detail.data.shed}</Descriptions.Item>
              <Descriptions.Item label={t.colStatus}>
                <Tag color={batchColor(detail.data.status)}>{label(t.batchStatus, detail.data.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t.batchPlaced}>{date(detail.data.placementDate)}</Descriptions.Item>
              <Descriptions.Item label={t.batchInitialBirds}>{detail.data.initialBirds}</Descriptions.Item>
              <Descriptions.Item label={t.batchTargetHarvest}>{date(detail.data.targetHarvestDate)}</Descriptions.Item>
            </Descriptions>

            <Row gutter={12}>
              <Col span={8}><Card size="small"><Statistic title={t.batchCurrentBirds} value={detail.data.summary.currentBirds} /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title={t.batchMortalityPct} value={detail.data.summary.mortalityPct} suffix="%" /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title={t.batchFcr} value={detail.data.summary.fcr ?? '—'} /></Card></Col>
              <Col span={8}><Card size="small" style={{ marginTop: 12 }}><Statistic title={t.batchAvgWeight} value={kg(detail.data.summary.latestAvgWeightG)} /></Card></Col>
              <Col span={8}><Card size="small" style={{ marginTop: 12 }}><Statistic title={t.batchLiveWeight} value={detail.data.summary.totalLiveWeightKg ?? 0} suffix="kg" /></Card></Col>
              <Col span={8}><Card size="small" style={{ marginTop: 12 }}><Statistic title={t.colExpenses} value={money(detail.data.summary.totalExpensesMinor)} /></Card></Col>
            </Row>

            <Card size="small" title={t.batchDailyLogs}>
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={detail.data.dailyLogs}
                columns={[
                  { title: t.colDate, dataIndex: 'date', render: (d: string) => date(d) },
                  { title: t.batchOpen, dataIndex: 'openingBirds' },
                  { title: t.batchMort, dataIndex: 'mortality' },
                  { title: t.colCulls, dataIndex: 'culls' },
                  { title: t.batchClose, dataIndex: 'closingBirds' },
                  { title: t.batchAvgWt, dataIndex: 'avgWeight', render: (g: number | null) => kg(g) },
                  { title: t.batchFeed, dataIndex: 'feedConsumed', render: (g: number | null) => kg(g) },
                ]}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </Card>
  );
}
