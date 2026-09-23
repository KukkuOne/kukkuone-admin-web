import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Table } from 'antd';
import { api } from '../lib/api';
import { date } from '../lib/format';

interface Farm {
  id: string;
  name: string;
  location: string | null;
  createdAt: string;
  org: { name: string };
  _count: { sheds: number; batches: number };
}

export default function Farms() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['farms'],
    queryFn: () => api.get<Farm[]>('/admin/farms'),
  });

  return (
    <Card title="Farms">
      {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        columns={[
          { title: 'Farm', dataIndex: 'name' },
          { title: 'Organization', dataIndex: ['org', 'name'] },
          { title: 'Location', dataIndex: 'location', render: (l: string | null) => l ?? '—' },
          { title: 'Sheds', dataIndex: ['_count', 'sheds'] },
          { title: 'Batches', dataIndex: ['_count', 'batches'] },
          { title: 'Created', dataIndex: 'createdAt', render: (d: string) => date(d) },
        ]}
      />
    </Card>
  );
}
