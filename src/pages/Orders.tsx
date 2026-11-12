import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Select, Table, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { date, money, NUM } from '../lib/format';
import { useParam } from '../lib/useParam';

const STATUSES = ['PLACED', 'ACCEPTED', 'DELIVERED', 'INVOICED', 'SETTLED', 'CANCELLED'];
const STATUS_COLOR: Record<string, string> = {
  PLACED: 'blue',
  ACCEPTED: 'cyan',
  DELIVERED: 'gold',
  INVOICED: 'orange',
  SETTLED: 'green',
  CANCELLED: 'default',
};

interface Order {
  id: string;
  partnerOrgId: string;
  partner: string | null;
  farmerOrgId: string;
  farmer: string | null;
  kind: 'CHICK' | 'FEED';
  qty: number;
  feedType: string | null;
  hatcheryName: string | null;
  unitPriceMinor: number | null;
  status: string;
  needBy: string | null;
  delivery: { deliveredOn: string; received: number; dead: number } | null;
  createdAt: string;
}

/** Chick and feed orders farms placed on their trading partners. The partner's cost price is not shown. */
export default function Orders() {
  const [status, setStatus] = useParam('status');
  const { data, isLoading, error } = useQuery({
    queryKey: ['input-orders', status],
    queryFn: () => api.get<Order[]>(`/admin/input-orders${status ? `?status=${status}` : ''}`),
  });

  return (
    <Card
      title={<h1 style={{ fontSize: 16, margin: 0 }}>Partner orders</h1>}
      extra={
        <Select
          aria-label="Status"
          allowClear
          placeholder="All statuses"
          style={{ width: 180 }}
          value={status}
          onChange={(v) => setStatus(v)}
          options={STATUSES.map((s) => ({ value: s, label: s }))}
        />
      }
    >
      {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: status ? 'No order in this status — clear the filter' : 'No partner orders yet' }}
        columns={[
          { title: 'Placed', dataIndex: 'createdAt', render: (d: string) => date(d) },
          { title: 'Farm', key: 'farmer', render: (_, o: Order) => <Link to={`/organizations?org=${o.farmerOrgId}`}>{o.farmer ?? 'Unknown'}</Link> },
          { title: 'Partner', key: 'partner', render: (_, o: Order) => <Link to={`/organizations?org=${o.partnerOrgId}`}>{o.partner ?? 'Unknown'}</Link> },
          {
            title: 'What',
            key: 'what',
            render: (_, o: Order) => (o.kind === 'CHICK' ? `Chicks${o.hatcheryName ? ` · ${o.hatcheryName}` : ''}` : `Feed${o.feedType ? ` · ${o.feedType}` : ''}`),
          },
          { title: 'Qty', dataIndex: 'qty', align: 'right', render: (n: number, o: Order) => <span style={NUM}>{n.toLocaleString('en-IN')} {o.kind === 'CHICK' ? 'chicks' : 'bags'}</span> },
          { title: 'Unit price', dataIndex: 'unitPriceMinor', align: 'right', render: (p: number | null) => <span style={NUM}>{money(p)}</span> },
          { title: 'Need by', dataIndex: 'needBy', render: (d: string | null) => date(d) },
          {
            title: 'Delivered',
            dataIndex: 'delivery',
            render: (d: Order['delivery']) =>
              d ? (
                <span style={NUM}>
                  {date(d.deliveredOn)} · {d.received.toLocaleString('en-IN')} received{d.dead ? `, ${d.dead} dead` : ''}
                </span>
              ) : (
                '—'
              ),
          },
          { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLOR[s] ?? 'default'}>{s}</Tag> },
        ]}
      />
    </Card>
  );
}
