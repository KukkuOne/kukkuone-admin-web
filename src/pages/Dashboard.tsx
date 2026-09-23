import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Col, Row, Spin, Statistic, Table, Tag } from 'antd';
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
  const { data, isLoading, error } = useQuery({
    queryKey: ['overview'],
    queryFn: () => api.get<Overview>('/admin/overview'),
  });

  if (error) return <Alert type="error" message="Failed to load" description={(error as Error).message} showIcon />;
  if (isLoading || !data) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  const stats = [
    { title: 'Organizations', value: data.counts.organizations },
    { title: 'Users', value: data.counts.users },
    { title: 'Farms', value: data.counts.farms },
    { title: 'Sheds', value: data.counts.sheds },
    { title: 'Batches', value: data.counts.batches },
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

      <Card title="Batches by status" size="small">
        {Object.keys(data.batchStatusCounts).length === 0 ? (
          <span style={{ color: '#999' }}>No batches yet</span>
        ) : (
          Object.entries(data.batchStatusCounts).map(([status, count]) => (
            <Tag key={status} color={batchColor(status)} style={{ marginBottom: 8 }}>
              {status}: {count}
            </Tag>
          ))
        )}
      </Card>

      <Card title="Recent batches" size="small">
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={data.recentBatches}
          columns={[
            { title: 'Organization', dataIndex: 'org' },
            { title: 'Farm', dataIndex: 'farm' },
            { title: 'Shed', dataIndex: 'shed' },
            { title: 'Breed', dataIndex: 'breed' },
            { title: 'Birds', dataIndex: 'initialBirds' },
            { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={batchColor(s)}>{s}</Tag> },
            { title: 'Created', dataIndex: 'createdAt', render: (d: string) => date(d) },
          ]}
        />
      </Card>
    </div>
  );
}
