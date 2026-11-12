import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Descriptions, Drawer, Input, Space, Table, Tabs, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import AuditTable, { type AuditRow } from '../components/AuditTable';
import { label, useT } from '../i18n';
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
  /** Null unless the console counts this user as an admin. */
  adminAuth: { passwordSet: boolean; authenticatorEnrolled: boolean } | null;
  memberships: Array<{ orgId: string; org: string; capability: string; role: string; roleKey: string; permissions: string[] }>;
  activity: AuditRow[];
}

function StatusAction({ user }: { user: UserDetail }) {
  const { modal, message } = App.useApp();
  const t = useT();
  const { email } = useAuth();
  const qc = useQueryClient();
  const suspend = user.status === 'active' || user.status === 'invited';
  const mutation = useMutation({
    mutationFn: () => api.post<{ status: string }>(`/admin/users/${user.id}/status`, { status: suspend ? 'suspended' : 'active' }),
    onSuccess: (r) => {
      message.success(t.userNowStatus(who(user), label(t.userStatus, r.status)));
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
          title: suspend ? t.userSuspendQ(who(user)) : t.userReactivateQ(who(user)),
          content: suspend ? t.userSuspendBody : t.userReactivateBody,
          okText: suspend ? t.userSuspend : t.userReactivate,
          okButtonProps: { danger: suspend },
          onOk: () => mutation.mutateAsync(),
        })
      }
    >
      {suspend ? t.userSuspendEllipsis : t.userReactivateEllipsis}
    </Button>
  );
}

/** For another admin who lost their authenticator; your own needs someone else, or the script. */
function ResetAuthenticatorAction({ user }: { user: UserDetail }) {
  const { modal, message } = App.useApp();
  const t = useT();
  const { email } = useAuth();
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.post<{ id: string }>(`/admin/users/${user.id}/admin-auth/reset-authenticator`),
    onSuccess: () => {
      message.success(t.userResetAuthDone(who(user)));
      qc.invalidateQueries({ queryKey: ['user', user.id] });
    },
    onError: (e) => message.error((e as Error).message),
  });

  if (!user.adminAuth || (user.email && user.email === email)) return null;

  return (
    <Button
      danger
      loading={mutation.isPending}
      onClick={() =>
        modal.confirm({
          title: t.userResetAuthQ(who(user)),
          content: t.userResetAuthBody,
          okText: t.userResetAuth,
          okButtonProps: { danger: true },
          onOk: () => mutation.mutateAsync(),
        })
      }
    >
      {t.userResetAuthEllipsis}
    </Button>
  );
}

export default function Users() {
  const t = useT();
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
      title={<h1 style={{ fontSize: 16, margin: 0 }}>{t.navUsers}</h1>}
      extra={
        <Input.Search
          placeholder={t.userSearchPlaceholder}
          aria-label={t.userSearchLabel}
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
        locale={{ emptyText: search ? t.userNoMatch : t.userNone }}
        columns={[
          {
            title: t.colPerson,
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
          { title: t.colEmail, dataIndex: 'email', render: (v: string | null) => v ?? '—' },
          { title: t.colMobile, dataIndex: 'phone', render: (v: string | null) => <span translate="no">{v ?? '—'}</span> },
          {
            title: t.userSignIn,
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
            title: t.userMemberships,
            dataIndex: 'memberships',
            render: (ms: UserRow['memberships']) =>
              ms.length === 0 ? (
                <Typography.Text type="secondary">{t.userNoMemberships}</Typography.Text>
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
          { title: t.colStatus, dataIndex: 'status', render: (s: string) => <Tag color={userStatusColor(s)}>{label(t.userStatus, s)}</Tag> },
          { title: t.colCreated, dataIndex: 'createdAt', render: (dt: string) => date(dt) },
        ]}
      />

      <Drawer
        title={d ? who(d) : t.userDrawerFallback}
        width={720}
        open={!!openId}
        onClose={() => setOpenId(undefined)}
        loading={detail.isLoading}
        extra={
          d && (
            <Space>
              <ResetAuthenticatorAction user={d} />
              <StatusAction user={d} />
            </Space>
          )
        }
        styles={{ body: { overscrollBehavior: 'contain' } }}
      >
        {detail.error && <Alert type="error" message={(detail.error as Error).message} showIcon />}
        {d && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label={t.colStatus}>
                <Tag color={userStatusColor(d.status)}>{label(t.userStatus, d.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t.colCreated}>{date(d.createdAt)}</Descriptions.Item>
              <Descriptions.Item label={t.colEmail}>{d.email ?? '—'}</Descriptions.Item>
              <Descriptions.Item label={t.colMobile}>
                <span translate="no">{d.phone ?? '—'}</span>
              </Descriptions.Item>
              {d.adminAuth && (
                <Descriptions.Item label={t.userAdminSignIn} span={2}>
                  <Space size={4} wrap>
                    <Tag color={d.adminAuth.passwordSet ? 'green' : 'default'}>
                      {d.adminAuth.passwordSet ? t.userPasswordSet : t.userNoPassword}
                    </Tag>
                    <Tag color={d.adminAuth.authenticatorEnrolled ? 'green' : 'default'}>
                      {d.adminAuth.authenticatorEnrolled ? t.userAuthEnrolled : t.userNoAuth}
                    </Tag>
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
            <Tabs
              items={[
                {
                  key: 'roles',
                  label: t.count(t.userRoles, d.memberships.length),
                  children:
                    d.memberships.length === 0 ? (
                      <Typography.Text type="secondary">{t.userNotAMember}</Typography.Text>
                    ) : (
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        {d.memberships.map((m) => (
                          <Card
                            key={`${m.orgId}-${m.roleKey}`}
                            size="small"
                            title={
                              <Space wrap>
                                <Link to={`/organizations?org=${m.orgId}`}>{m.org}</Link>
                                <Tag color={capColor(m.capability)}>
                                  {label(t.capability, m.capability)}
                                </Tag>
                                <span>{m.role}</span>
                              </Space>
                            }
                          >
                            {m.permissions.length === 0 ? (
                              <Typography.Text type="secondary">{t.userNoPermissions}</Typography.Text>
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
                  label: t.userIdentities,
                  children: (
                    <Table
                      rowKey={(i) => `${i.provider}-${i.createdAt}`}
                      size="small"
                      pagination={false}
                      dataSource={d.identities}
                      locale={{ emptyText: t.userPhoneOnly }}
                      columns={[
                        { title: t.userProvider, dataIndex: 'provider', render: (p: string) => <span translate="no">{p}</span> },
                        { title: t.colEmail, dataIndex: 'email', render: (v: string | null) => v ?? '—' },
                        { title: t.userLinked, dataIndex: 'createdAt', render: (v: string) => dateTime(v) },
                      ]}
                    />
                  ),
                },
                { key: 'activity', label: t.colActivity, children: <AuditTable rows={d.activity} showOrg /> },
              ]}
            />
          </Space>
        )}
      </Drawer>
    </Card>
  );
}
