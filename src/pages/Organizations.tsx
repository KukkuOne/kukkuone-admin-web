import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Descriptions, Drawer, Input, Space, Table, Tabs, Tag } from 'antd';
import { Link } from 'react-router-dom';
import AuditTable, { type AuditRow } from '../components/AuditTable';
import { api } from '../lib/api';
import { capColor, date, NUM, userStatusColor, who } from '../lib/format';
import { useParam } from '../lib/useParam';

interface Org {
  id: string;
  name: string;
  capabilities: string[];
  status: string;
  baseCurrency: string;
  createdAt: string;
  users: number;
  farms: number;
  batches: number;
}

interface OrgDetail {
  id: string;
  name: string;
  capabilities: string[];
  tradingCapabilities: string[];
  status: string;
  baseCurrency: string;
  createdAt: string;
  members: Array<{
    userId: string;
    email: string | null;
    phone: string | null;
    displayName: string | null;
    status: string;
    role: string;
    roleKey: string;
    capability: string;
  }>;
  farms: Array<{ id: string; name: string; location: string | null }>;
  batchCount: number;
  activity: AuditRow[];
}

function Caps({ caps }: { caps: string[] }) {
  if (caps.length === 0) return <span>—</span>;
  return (
    <Space size={4} wrap>
      {caps.map((c) => (
        <Tag key={c} color={capColor(c)} translate="no">
          {c}
        </Tag>
      ))}
    </Space>
  );
}

export default function Organizations() {
  const [search, setSearch] = useParam('q');
  const [openId, setOpenId] = useParam('org');
  const { data, isLoading, error } = useQuery({
    queryKey: ['organizations', search],
    queryFn: () => api.get<Org[]>(`/admin/organizations${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });
  const detail = useQuery({
    queryKey: ['organization', openId],
    queryFn: () => api.get<OrgDetail>(`/admin/organizations/${openId}`),
    enabled: !!openId,
  });
  const d = detail.data;

  return (
    <Card
      title={<h1 style={{ fontSize: 16, margin: 0 }}>Organizations</h1>}
      extra={
        <Input.Search
          placeholder="Search by name…"
          aria-label="Search organizations"
          allowClear
          defaultValue={search}
          onSearch={(v) => setSearch(v.trim() || undefined)}
          style={{ width: 260 }}
        />
      }
    >
      {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: search ? 'No organization matches that name — clear the search' : 'No organizations yet' }}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            render: (n: string, r: Org) => (
              <a
                href={`?org=${r.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpenId(r.id);
                }}
              >
                {n}
              </a>
            ),
          },
          { title: 'Capabilities', dataIndex: 'capabilities', render: (caps: string[]) => <Caps caps={caps} /> },
          { title: 'Users', dataIndex: 'users', align: 'right', render: (n: number) => <span style={NUM}>{n}</span> },
          { title: 'Farms', dataIndex: 'farms', align: 'right', render: (n: number) => <span style={NUM}>{n}</span> },
          { title: 'Batches', dataIndex: 'batches', align: 'right', render: (n: number) => <span style={NUM}>{n}</span> },
          { title: 'Currency', dataIndex: 'baseCurrency' },
          { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={userStatusColor(s)}>{s}</Tag> },
          { title: 'Created', dataIndex: 'createdAt', render: (dt: string) => date(dt) },
        ]}
      />

      <Drawer
        title={d?.name ?? 'Organization'}
        width={720}
        open={!!openId}
        onClose={() => setOpenId(undefined)}
        loading={detail.isLoading}
        styles={{ body: { overscrollBehavior: 'contain' } }}
      >
        {detail.error && <Alert type="error" message={(detail.error as Error).message} showIcon />}
        {d && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="Status">
                <Tag color={userStatusColor(d.status)}>{d.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Currency">{d.baseCurrency}</Descriptions.Item>
              <Descriptions.Item label="Capabilities" span={2}>
                <Caps caps={d.capabilities} />
              </Descriptions.Item>
              {d.capabilities.includes('TRADING_PARTNER') && (
                <Descriptions.Item label="Trading capabilities" span={2}>
                  <Caps caps={d.tradingCapabilities} />
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Batches">
                <Link to={`/batches?org=${d.id}`}>
                  <span style={NUM}>{d.batchCount}</span>
                </Link>
              </Descriptions.Item>
              <Descriptions.Item label="Created">{date(d.createdAt)}</Descriptions.Item>
            </Descriptions>
            <Tabs
              items={[
                {
                  key: 'members',
                  label: `Members (${d.members.length})`,
                  children: (
                    <Table
                      rowKey={(m) => `${m.userId}-${m.roleKey}`}
                      size="small"
                      pagination={false}
                      dataSource={d.members}
                      locale={{ emptyText: 'No members' }}
                      columns={[
                        { title: 'Person', key: 'who', render: (_, m) => <Link to={`/users?user=${m.userId}`}>{who(m)}</Link> },
                        { title: 'Role', dataIndex: 'role' },
                        { title: 'Capability', dataIndex: 'capability', render: (c: string) => <Tag color={capColor(c)} translate="no">{c}</Tag> },
                        { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={userStatusColor(s)}>{s}</Tag> },
                      ]}
                    />
                  ),
                },
                {
                  key: 'farms',
                  label: `Farms (${d.farms.length})`,
                  children: (
                    <Table
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={d.farms}
                      locale={{ emptyText: 'No farms' }}
                      columns={[
                        { title: 'Farm', dataIndex: 'name' },
                        { title: 'Location', dataIndex: 'location', render: (l: string | null) => l ?? '—' },
                      ]}
                    />
                  ),
                },
                { key: 'activity', label: 'Activity', children: <AuditTable rows={d.activity} /> },
              ]}
            />
          </Space>
        )}
      </Drawer>
    </Card>
  );
}
