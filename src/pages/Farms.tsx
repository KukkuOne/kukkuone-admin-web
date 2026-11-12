import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Table } from 'antd';
import { useT } from '../i18n';
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
  const t = useT();
  const { data, isLoading, error } = useQuery({
    queryKey: ['farms'],
    queryFn: () => api.get<Farm[]>('/admin/farms'),
  });

  return (
    <Card title={t.navFarms}>
      {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        columns={[
          { title: t.colFarm, dataIndex: 'name' },
          { title: t.colOrg, dataIndex: ['org', 'name'] },
          { title: t.colLocation, dataIndex: 'location', render: (l: string | null) => l ?? '—' },
          { title: t.colSheds, dataIndex: ['_count', 'sheds'] },
          { title: t.colBatches, dataIndex: ['_count', 'batches'] },
          { title: t.colCreated, dataIndex: 'createdAt', render: (d: string) => date(d) },
        ]}
      />
    </Card>
  );
}
