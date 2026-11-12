import { Table, Typography } from 'antd';
import { useT } from '../i18n';
import { dateTime } from '../lib/format';

export interface AuditRow {
  id: string;
  orgId: string;
  org?: string | null;
  actorUserId: string;
  actor?: string | null;
  resource: string;
  resourceId: string;
  action: string;
  before: unknown;
  after: unknown;
  at: string;
}

function json(v: unknown): string {
  if (v == null) return '—';
  return typeof v === 'string' ? v : JSON.stringify(v);
}

/** Audit rows: who did what to which resource, with before → after. */
export default function AuditTable({ rows, loading, showOrg }: { rows: AuditRow[]; loading?: boolean; showOrg?: boolean }) {
  const t = useT();
  return (
    <Table
      rowKey="id"
      size="small"
      loading={loading}
      dataSource={rows}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: t.auditEmpty }}
      pagination={{ pageSize: 25, hideOnSinglePage: true }}
      columns={[
        { title: t.auditWhen, dataIndex: 'at', render: (d: string) => dateTime(d), width: 150 },
        ...(showOrg ? [{ title: t.colOrg, dataIndex: 'org', render: (o: string | null, r: AuditRow) => o ?? r.orgId }] : []),
        { title: t.auditActor, dataIndex: 'actor', render: (a: string | null, r: AuditRow) => a ?? <Typography.Text code translate="no">{r.actorUserId.slice(0, 8)}</Typography.Text> },
        { title: t.auditAction, dataIndex: 'action', render: (a: string) => <Typography.Text code translate="no">{a}</Typography.Text> },
        { title: t.auditResource, dataIndex: 'resource', render: (res: string, r: AuditRow) => <span translate="no">{res} · {r.resourceId.slice(0, 8)}</span> },
        {
          title: t.auditChange,
          key: 'change',
          render: (_: unknown, r: AuditRow) => (
            <Typography.Text type="secondary" style={{ maxWidth: 360, display: 'inline-block' }} ellipsis={{ tooltip: true }}>
              {json(r.before)} → {json(r.after)}
            </Typography.Text>
          ),
        },
      ]}
    />
  );
}
