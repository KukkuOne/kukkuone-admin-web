import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { label, useT } from '../i18n';
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
  const t = useT();
  const { data, isLoading, error } = useQuery({ queryKey: ['vets'], queryFn: () => api.get<VetsResponse>('/admin/vets') });

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={1} style={{ fontSize: 20, margin: 0 }}>
        {t.navVets}
      </Typography.Title>
      {error && <Alert type="error" message={(error as Error).message} showIcon />}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card loading={isLoading}>
            <Statistic title={t.vetPractices} value={data?.practices.length ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={isLoading}>
            <Statistic title={t.vetOpenCases} value={data?.cases.open ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={isLoading}>
            <Statistic title={t.vetUnclaimed} value={data?.cases.unclaimed ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={isLoading}>
            <Statistic title={t.vetClosed} value={data?.cases.byStatus.CLOSED ?? 0} />
          </Card>
        </Col>
      </Row>
      <Card title={t.vetPractices} size="small">
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={data?.practices ?? []}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t.vetNoPractice }}
          expandable={{
            rowExpandable: (p) => p.vets.length > 0,
            expandedRowRender: (p) => (
              <Table
                rowKey="userId"
                size="small"
                pagination={false}
                dataSource={p.vets}
                columns={[
                  { title: t.vetVet, key: 'who', render: (_, v: Vet) => <Link to={`/users?user=${v.userId}`}>{who(v)}</Link> },
                  { title: t.colMobile, dataIndex: 'phone', render: (v: string | null) => <span translate="no">{v ?? '—'}</span> },
                  { title: t.colRole, dataIndex: 'role' },
                  { title: t.colStatus, dataIndex: 'status', render: (s: string) => <Tag color={userStatusColor(s)}>{label(t.userStatus, s)}</Tag> },
                ]}
              />
            ),
          }}
          columns={[
            { title: t.vetPractice, dataIndex: 'name', render: (n: string, p: Practice) => <Link to={`/organizations?org=${p.id}`}>{n}</Link> },
            { title: t.vetVets, key: 'vets', align: 'right', render: (_, p: Practice) => <span style={NUM}>{p.vets.length}</span> },
            ...CASE_STATUSES.map((s) => ({
              title: label(t.caseStatus, s),
              key: s,
              align: 'right' as const,
              render: (_: unknown, p: Practice) => <span style={NUM}>{p.cases[s] ?? 0}</span>,
            })),
            { title: t.colStatus, dataIndex: 'status', render: (s: string) => <Tag color={userStatusColor(s)}>{label(t.userStatus, s)}</Tag> },
            { title: t.vetJoined, dataIndex: 'createdAt', render: (d: string) => date(d) },
          ]}
        />
      </Card>
    </Space>
  );
}
