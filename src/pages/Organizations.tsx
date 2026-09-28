import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Input, Space, Table, Tag } from 'antd';
import { useState } from 'react';
import { api } from '../lib/api';
import { capColor, date } from '../lib/format';

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

export default function Organizations() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['organizations', search],
    queryFn: () => api.get<Org[]>(`/admin/organizations${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

  return (
    <Card
      title="Organizations"
      extra={
        <Input.Search
          placeholder="Search organizations"
          allowClear
          onSearch={setSearch}
          style={{ width: 260 }}
        />
      }
    >
      {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          {
            title: 'Capabilities',
            dataIndex: 'capabilities',
            render: (caps: string[]) => (
              <Space size={4} wrap>
                {caps.map((c) => (
                  <Tag key={c} color={capColor(c)}>
                    {c}
                  </Tag>
                ))}
              </Space>
            ),
          },
          { title: 'Users', dataIndex: 'users' },
          { title: 'Farms', dataIndex: 'farms' },
          { title: 'Batches', dataIndex: 'batches' },
          { title: 'Currency', dataIndex: 'baseCurrency' },
          { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s}</Tag> },
          { title: 'Created', dataIndex: 'createdAt', render: (d: string) => date(d) },
        ]}
      />
    </Card>
  );
}
