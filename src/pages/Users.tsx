import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Descriptions, Drawer, Input, Space, Table, Tabs, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import AuditTable, { type AuditRow } from '../components/AuditTable';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { capColor, date, dateTime, userStatusColor, who } from '../lib/format';
import { useParam } from '../lib/useParam';

interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  status: string;
  createdAt: string;
  providers: string[];
  memberships: Array<{ org: string; role: string; capability: string }>;
}

interface UserDetail {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  status: string;
  createdAt: string;
  identities: Array<{ provider: string; email: string | null; createdAt: string }>;
  memberships: Array<{ orgId: string; org: string; capability: string; role: string; roleKey: string; permissions: string[] }>;
  activity: AuditRow[];
}

function StatusAction({ user }: { user: UserDetail }) {
  const { modal, message } = App.useApp();
  const { email } = useAuth();
  const qc = useQueryClient();
  const suspend = user.status === 'active' || user.status === 'invited';
  const mutation = useMutation({
    mutationFn: () => api.post<{ status: string }>(`/admin/users/${user.id}/status`, { status: suspend ? 'suspended' : 'active' }),
    onSuccess: (r) => {
      message.success(`${who(user)} is now ${r.status}`);
      qc.invalidateQueries({ queryKey: ['user', user.id] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => message.error((e as Error).message),
  });

  if (!suspend && user.status !== 'suspended') return null;
  if (user.email && user.email === email) return null;

  return (
    <Button
      danger={suspend}
      loading={mutation.isPending}
      onClick={() =>
        modal.confirm({
          title: suspend ? `Suspend ${who(user)}?` : `Reactivate ${who(user)}?`,
          content: suspend
            ? 'Mobile-number sessions stop on their next request and they cannot sign in again until reactivated. Google sign-in does not check this status yet. Recorded in the audit log.'
            : 'They can sign in again with their mobile number. Recorded in the audit log.',
          okText: suspend ? 'Suspend' : 'Reactivate',
          okButtonProps: { danger: suspend },
          onOk: () => mutation.mutateAsync(),
        })
      }
    >
      {suspend ? 'Suspend…' : 'Reactivate…'}
    </Button>
  );
}

export default function Users() {
  const [search, setSearch] = useParam('q');
  const [openId, setOpenId] = useParam('user');
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', search],
    queryFn: () => api.get<UserRow[]>(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });
  const detail = useQuery({
    queryKey: ['user', openId],
    queryFn: () => api.get<UserDetail>(`/admin/users/${openId}`),
    enabled: !!openId,
  });
  const d = detail.data;

  return (
    <Card
      title={<h1 style={{ fontSize: 16, margin: 0 }}>Users</h1>}
      extra={
        <Input.Search
          placeholder="Name, email or mobile…"
          aria-label="Search users"
          allowClear
          spellCheck={false}
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
        locale={{ emptyText: search ? 'No user matches — clear the search' : 'No users yet' }}
        columns={[
          {
            title: 'Person',
            key: 'who',
            render: (_, u) => (
              <a
                href={`?user=${u.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpenId(u.id);
                }}
              >
                {who(u)}
              </a>
            ),
          },
          { title: 'Email', dataIndex: 'email', render: (v: string | null) => v ?? '—' },
          { title: 'Mobile', dataIndex: 'phone', render: (v: string | null) => <span translate="no">{v ?? '—'}</span> },
          {
            title: 'Sign-in',
            dataIndex: 'providers',
            render: (ps: string[]) => (
              <Space size={4}>
                {ps.map((p) => (
                  <Tag key={p}>{p}</Tag>
                ))}
              </Space>
            ),
          },
          {
            title: 'Memberships',
            dataIndex: 'memberships',
            render: (ms: UserRow['memberships']) =>
              ms.length === 0 ? (
                <Typography.Text type="secondary">none</Typography.Text>
              ) : (
                <Space size={4} wrap>
                  {ms.map((m, i) => (
                    <Tag key={i} color={capColor(m.capability)}>
                      {m.org} · {m.role}
                    </Tag>
                  ))}
                </Space>
              ),
          },
          { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={userStatusColor(s)}>{s}</Tag> },
          { title: 'Created', dataIndex: 'createdAt', render: (dt: string) => date(dt) },
        ]}
      />

      <Drawer
        title={d ? who(d) : 'User'}
        width={720}
        open={!!openId}
        onClose={() => setOpenId(undefined)}
        loading={detail.isLoading}
        extra={d && <StatusAction user={d} />}
        styles={{ body: { overscrollBehavior: 'contain' } }}
      >
        {detail.error && <Alert type="error" message={(detail.error as Error).message} showIcon />}
        {d && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="Status">
                <Tag color={userStatusColor(d.status)}>{d.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">{date(d.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Email">{d.email ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Mobile">
                <span translate="no">{d.phone ?? '—'}</span>
              </Descriptions.Item>
            </Descriptions>
            <Tabs
              items={[
                {
                  key: 'roles',
                  label: `Roles (${d.memberships.length})`,
                  children:
                    d.memberships.length === 0 ? (
                      <Typography.Text type="secondary">Not a member of any organization.</Typography.Text>
                    ) : (
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        {d.memberships.map((m) => (
                          <Card
                            key={`${m.orgId}-${m.roleKey}`}
                            size="small"
                            title={
                              <Space wrap>
                                <Link to={`/organizations?org=${m.orgId}`}>{m.org}</Link>
                                <Tag color={capColor(m.capability)} translate="no">
                                  {m.capability}
                                </Tag>
                                <span>{m.role}</span>
                              </Space>
                            }
                          >
                            {m.permissions.length === 0 ? (
                              <Typography.Text type="secondary">No permissions on this role.</Typography.Text>
                            ) : (
                              <Space size={4} wrap>
                                {m.permissions.map((p) => (
                                  <Typography.Text key={p} code translate="no">
                                    {p}
                                  </Typography.Text>
                                ))}
                              </Space>
                            )}
                          </Card>
                        ))}
                      </Space>
                    ),
                },
                {
                  key: 'identities',
                  label: 'Sign-in identities',
                  children: (
                    <Table
                      rowKey={(i) => `${i.provider}-${i.createdAt}`}
                      size="small"
                      pagination={false}
                      dataSource={d.identities}
                      locale={{ emptyText: 'Signs in by mobile number only' }}
                      columns={[
                        { title: 'Provider', dataIndex: 'provider' },
                        { title: 'Email', dataIndex: 'email', render: (v: string | null) => v ?? '—' },
                        { title: 'Linked', dataIndex: 'createdAt', render: (v: string) => dateTime(v) },
                      ]}
                    />
                  ),
                },
                { key: 'activity', label: 'Activity', children: <AuditTable rows={d.activity} showOrg /> },
              ]}
            />
          </Space>
        )}
      </Drawer>
    </Card>
  );
}
