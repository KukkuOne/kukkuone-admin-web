import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Descriptions, Drawer, Input, Space, Table, Tabs, Tag } from 'antd';
import { Link } from 'react-router-dom';
import AuditTable, { type AuditRow } from '../components/AuditTable';
import { label, useT } from '../i18n';
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

function Caps({ caps, labels }: { caps: string[]; labels: Record<string, string> }) {
  if (caps.length === 0) return <span>—</span>;
  return (
    <Space size={4} wrap>
      {caps.map((c) => (
        <Tag key={c} color={capColor(c)}>
          {label(labels, c)}
        </Tag>
      ))}
    </Space>
  );
}

export default function Organizations() {
  const t = useT();
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
      title={<h1 style={{ fontSize: 16, margin: 0 }}>{t.navOrgs}</h1>}
      extra={
        <Input.Search
          placeholder={t.orgSearchPlaceholder}
          aria-label={t.orgSearchLabel}
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
        locale={{ emptyText: search ? t.orgNoMatch : t.orgNone }}
        columns={[
          {
            title: t.colName,
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
          { title: t.colCapabilities, dataIndex: 'capabilities', render: (caps: string[]) => <Caps caps={caps} labels={t.capability} /> },
          { title: t.colUsers, dataIndex: 'users', align: 'right', render: (n: number) => <span style={NUM}>{n}</span> },
          { title: t.colFarms, dataIndex: 'farms', align: 'right', render: (n: number) => <span style={NUM}>{n}</span> },
          { title: t.colBatches, dataIndex: 'batches', align: 'right', render: (n: number) => <span style={NUM}>{n}</span> },
          { title: t.colCurrency, dataIndex: 'baseCurrency' },
          { title: t.colStatus, dataIndex: 'status', render: (s: string) => <Tag color={userStatusColor(s)}>{label(t.userStatus, s)}</Tag> },
          { title: t.colCreated, dataIndex: 'createdAt', render: (dt: string) => date(dt) },
        ]}
      />

      <Drawer
        title={d?.name ?? t.orgDrawerFallback}
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
              <Descriptions.Item label={t.colStatus}>
                <Tag color={userStatusColor(d.status)}>{label(t.userStatus, d.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t.colCurrency}>{d.baseCurrency}</Descriptions.Item>
              <Descriptions.Item label={t.colCapabilities} span={2}>
                <Caps caps={d.capabilities} labels={t.capability} />
              </Descriptions.Item>
              {d.capabilities.includes('TRADING_PARTNER') && (
                <Descriptions.Item label={t.orgTradingCapabilities} span={2}>
                  <Caps caps={d.tradingCapabilities} labels={t.tradingCapability} />
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t.colBatches}>
                <Link to={`/batches?org=${d.id}`}>
                  <span style={NUM}>{d.batchCount}</span>
                </Link>
              </Descriptions.Item>
              <Descriptions.Item label={t.colCreated}>{date(d.createdAt)}</Descriptions.Item>
            </Descriptions>
            <Tabs
              items={[
                {
                  key: 'members',
                  label: t.count(t.orgMembers, d.members.length),
                  children: (
                    <Table
                      rowKey={(m) => `${m.userId}-${m.roleKey}`}
                      size="small"
                      pagination={false}
                      dataSource={d.members}
                      locale={{ emptyText: t.orgNoMembers }}
                      columns={[
                        { title: t.colPerson, key: 'who', render: (_, m) => <Link to={`/users?user=${m.userId}`}>{who(m)}</Link> },
                        { title: t.colRole, dataIndex: 'role' },
                        { title: t.colCapability, dataIndex: 'capability', render: (c: string) => <Tag color={capColor(c)}>{label(t.capability, c)}</Tag> },
                        { title: t.colStatus, dataIndex: 'status', render: (s: string) => <Tag color={userStatusColor(s)}>{label(t.userStatus, s)}</Tag> },
                      ]}
                    />
                  ),
                },
                {
                  key: 'farms',
                  label: t.count(t.colFarms, d.farms.length),
                  children: (
                    <Table
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={d.farms}
                      locale={{ emptyText: t.orgNoFarms }}
                      columns={[
                        { title: t.colFarm, dataIndex: 'name' },
                        { title: t.colLocation, dataIndex: 'location', render: (l: string | null) => l ?? '—' },
                      ]}
                    />
                  ),
                },
                { key: 'activity', label: t.colActivity, children: <AuditTable rows={d.activity} /> },
              ]}
            />
          </Space>
        )}
      </Drawer>
    </Card>
  );
}
