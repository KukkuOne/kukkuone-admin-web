import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Input, Space, Table, Tag } from 'antd';
import { useState } from 'react';
import { api } from '../lib/api';
import { date } from '../lib/format';

interface UserRow {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  providers: string[];
  memberships: Array<{ org: string; role: string; capability: string }>;
}

export default function Users() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', search],
    queryFn: () => api.get<UserRow[]>(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

  return (
    <Card
      title="Users"
      extra={<Input.Search placeholder="Search users" allowClear onSearch={setSearch} style={{ width: 260 }} />}
    >
      {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        columns={[
          { title: 'Email', dataIndex: 'email' },
          { title: 'Name', dataIndex: 'displayName', render: (n: string | null) => n ?? '—' },
          {
            title: 'Providers',
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
                <span style={{ color: '#999' }}>none</span>
              ) : (
                <Space size={4} wrap>
                  {ms.map((m, i) => (
                    <Tag key={i} color="blue">
                      {m.org} · {m.role}
                    </Tag>
                  ))}
                </Space>
              ),
          },
          { title: 'Created', dataIndex: 'createdAt', render: (d: string) => date(d) },
        ]}
      />
    </Card>
  );
}
