import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Col, Row, Spin, Statistic, Table, Tag } from 'antd';
import { label, useT } from '../i18n';
import { api } from '../lib/api';
import { batchColor, date } from '../lib/format';

interface Overview {
  counts: { organizations: number; users: number; farms: number; sheds: number; batches: number };
  batchStatusCounts: Record<string, number>;
  recentBatches: Array<{
    id: string;
    org: string;
    farm: string;
    shed: string;
    breed: string;
    status: string;
    initialBirds: number;
    createdAt: string;
  }>;
}

export default function Dashboard() {
  const t = useT();
  const { data, isLoading, error } = useQuery({
    queryKey: ['overview'],
    queryFn: () => api.get<Overview>('/admin/overview'),
  });

  if (error) return <Alert type="error" message={t.loadFailed} description={(error as Error).message} showIcon />;
  if (isLoading || !data) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  const stats = [
    { title: t.navOrgs, value: data.counts.organizations },
    { title: t.colUsers, value: data.counts.users },
    { title: t.colFarms, value: data.counts.farms },
    { title: t.colSheds, value: data.counts.sheds },
    { title: t.colBatches, value: data.counts.batches },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        {stats.map((s) => (
          <Col key={s.title} xs={12} sm={8} md={8} lg={4} flex="1">
            <Card>
              <Statistic title={s.title} value={s.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title={t.dashBatchesByStatus} size="small">
        {Object.keys(data.batchStatusCounts).length === 0 ? (
          <span style={{ color: '#999' }}>{t.dashNoBatches}</span>
        ) : (
          Object.entries(data.batchStatusCounts).map(([status, count]) => (
            <Tag key={status} color={batchColor(status)} style={{ marginBottom: 8 }}>
              {t.dashStatusCount(label(t.batchStatus, status), count)}
            </Tag>
          ))
        )}
      </Card>

      <Card title={t.dashRecentBatches} size="small">
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={data.recentBatches}
          columns={[
            { title: t.colOrg, dataIndex: 'org' },
            { title: t.colFarm, dataIndex: 'farm' },
            { title: t.colShed, dataIndex: 'shed' },
            { title: t.colBreed, dataIndex: 'breed' },
            { title: t.colBirds, dataIndex: 'initialBirds' },
            { title: t.colStatus, dataIndex: 'status', render: (s: string) => <Tag color={batchColor(s)}>{label(t.batchStatus, s)}</Tag> },
            { title: t.colCreated, dataIndex: 'createdAt', render: (d: string) => date(d) },
          ]}
        />
      </Card>
    </div>
  );
}
