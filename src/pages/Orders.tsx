import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Select, Table, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { label, useT } from '../i18n';
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
  const t = useT();
  const [status, setStatus] = useParam('status');
  const { data, isLoading, error } = useQuery({
    queryKey: ['input-orders', status],
    queryFn: () => api.get<Order[]>(`/admin/input-orders${status ? `?status=${status}` : ''}`),
  });

  return (
    <Card
      title={<h1 style={{ fontSize: 16, margin: 0 }}>{t.navOrders}</h1>}
      extra={
        <Select
          aria-label={t.colStatus}
          allowClear
          placeholder={t.orderAllStatuses}
          style={{ width: 180 }}
          value={status}
          onChange={(v) => setStatus(v)}
          options={STATUSES.map((s) => ({ value: s, label: label(t.orderStatus, s) }))}
        />
      }
    >
      {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: status ? t.orderNoMatch : t.orderNone }}
        columns={[
          { title: t.orderPlaced, dataIndex: 'createdAt', render: (d: string) => date(d) },
          { title: t.colFarm, key: 'farmer', render: (_, o: Order) => <Link to={`/organizations?org=${o.farmerOrgId}`}>{o.farmer ?? t.unknown}</Link> },
          { title: t.orderPartner, key: 'partner', render: (_, o: Order) => <Link to={`/organizations?org=${o.partnerOrgId}`}>{o.partner ?? t.unknown}</Link> },
          {
            title: t.orderWhat,
            key: 'what',
            render: (_, o: Order) => (o.kind === 'CHICK' ? `${t.orderChicks}${o.hatcheryName ? ` · ${o.hatcheryName}` : ''}` : `${t.orderFeed}${o.feedType ? ` · ${o.feedType}` : ''}`),
          },
          { title: t.orderQty, dataIndex: 'qty', align: 'right', render: (n: number, o: Order) => <span style={NUM}>{n.toLocaleString('en-IN')} {o.kind === 'CHICK' ? t.orderChicksUnit : t.orderBagsUnit}</span> },
          { title: t.orderUnitPrice, dataIndex: 'unitPriceMinor', align: 'right', render: (p: number | null) => <span style={NUM}>{money(p)}</span> },
          { title: t.orderNeedBy, dataIndex: 'needBy', render: (d: string | null) => date(d) },
          {
            title: t.orderDelivered,
            dataIndex: 'delivery',
            render: (d: Order['delivery']) =>
              d ? (
                <span style={NUM}>{t.orderDeliveredLine(date(d.deliveredOn), d.received.toLocaleString('en-IN'), d.dead)}</span>
              ) : (
                '—'
              ),
          },
          { title: t.colStatus, dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLOR[s] ?? 'default'}>{label(t.orderStatus, s)}</Tag> },
        ]}
      />
    </Card>
  );
}
