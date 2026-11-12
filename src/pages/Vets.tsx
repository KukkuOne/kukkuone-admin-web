import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { date, NUM, userStatusColor, who } from '../lib/format';

const CASE_STATUSES = ['RAISED', 'TRIAGED', 'VISIT_NEEDED', 'VISITED', 'CLOSED', 'WITHDRAWN'] as const;

interface Vet {
  userId: string;
  displayName: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  role: string;
}

interface Practice {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  vets: Vet[];
  cases: Record<string, number>;
}

interface VetsResponse {
  practices: Practice[];
  cases: { byStatus: Record<string, number>; open: number; unclaimed: number };
}

/**
 * Vet practices and how many cases sit at each stage. Counts only: which farm
 * raised what, and what it turned out to be, stays between the farm and its vet.
 */
export default function Vets() {
  const { data, isLoading, error } = useQuery({ queryKey: ['vets'], queryFn: () => api.get<VetsResponse>('/admin/vets') });

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={1} style={{ fontSize: 20, margin: 0 }}>
        Vets
      </Typography.Title>
      {error && <Alert type="error" message={(error as Error).message} showIcon />}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card loading={isLoading}>
            <Statistic title="Practices" value={data?.practices.length ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={isLoading}>
            <Statistic title="Open cases" value={data?.cases.open ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={isLoading}>
            <Statistic title="Unclaimed in the pool" value={data?.cases.unclaimed ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={isLoading}>
            <Statistic title="Closed" value={data?.cases.byStatus.CLOSED ?? 0} />
          </Card>
        </Col>
      </Row>
      <Card title="Practices" size="small">
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={data?.practices ?? []}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'No vet practice has onboarded yet' }}
          expandable={{
            rowExpandable: (p) => p.vets.length > 0,
            expandedRowRender: (p) => (
              <Table
                rowKey="userId"
                size="small"
                pagination={false}
                dataSource={p.vets}
                columns={[
                  { title: 'Vet', key: 'who', render: (_, v: Vet) => <Link to={`/users?user=${v.userId}`}>{who(v)}</Link> },
                  { title: 'Mobile', dataIndex: 'phone', render: (v: string | null) => <span translate="no">{v ?? '—'}</span> },
                  { title: 'Role', dataIndex: 'role' },
                  { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={userStatusColor(s)}>{s}</Tag> },
                ]}
              />
            ),
          }}
          columns={[
            { title: 'Practice', dataIndex: 'name', render: (n: string, p: Practice) => <Link to={`/organizations?org=${p.id}`}>{n}</Link> },
            { title: 'Vets', key: 'vets', align: 'right', render: (_, p: Practice) => <span style={NUM}>{p.vets.length}</span> },
            ...CASE_STATUSES.map((s) => ({
              title: s.replace('_', ' ').toLowerCase(),
              key: s,
              align: 'right' as const,
              render: (_: unknown, p: Practice) => <span style={NUM}>{p.cases[s] ?? 0}</span>,
            })),
            { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={userStatusColor(s)}>{s}</Tag> },
            { title: 'Joined', dataIndex: 'createdAt', render: (d: string) => date(d) },
          ]}
        />
      </Card>
    </Space>
  );
}
