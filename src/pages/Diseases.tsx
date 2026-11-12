import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Input, Table, Tag, Typography } from 'antd';
import { api } from '../lib/api';
import { date } from '../lib/format';
import { useParam } from '../lib/useParam';

interface Disease {
  id: string;
  code: string;
  name: string;
  nameTe: string | null;
  summary: string | null;
  notifiable: boolean;
  updatedAt: string;
}

/** The catalogue vets diagnose against. Read-only: entries come from the vet-sourced seed, never from this console. */
export default function Diseases() {
  const [q, setQ] = useParam('q');
  const { data, isLoading, error } = useQuery({ queryKey: ['diseases'], queryFn: () => api.get<Disease[]>('/admin/diseases') });
  const needle = q?.toLowerCase();
  const rows = (data ?? []).filter(
    (d) => !needle || d.name.toLowerCase().includes(needle) || d.code.toLowerCase().includes(needle) || (d.nameTe ?? '').includes(q!),
  );

  return (
    <Card
      title={<h1 style={{ fontSize: 16, margin: 0 }}>Disease catalogue</h1>}
      extra={
        <Input.Search
          placeholder="Name or code…"
          aria-label="Search diseases"
          allowClear
          spellCheck={false}
          defaultValue={q}
          onSearch={(v) => setQ(v.trim() || undefined)}
          style={{ width: 240 }}
        />
      }
    >
      <Typography.Paragraph type="secondary">
        Read-only. Entries are added through the vet-reviewed seed, not here.
      </Typography.Paragraph>
      {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: q ? 'Nothing matches — clear the search' : 'The catalogue is empty — run the disease seed' }}
        columns={[
          { title: 'Code', dataIndex: 'code', render: (c: string) => <Typography.Text code translate="no">{c}</Typography.Text> },
          { title: 'Name', dataIndex: 'name' },
          { title: 'Telugu', dataIndex: 'nameTe', render: (v: string | null) => <span lang="te">{v ?? '—'}</span> },
          { title: 'Notifiable', dataIndex: 'notifiable', render: (n: boolean) => (n ? <Tag color="red">Notifiable</Tag> : '—') },
          {
            title: 'Summary',
            dataIndex: 'summary',
            render: (s: string | null) => (
              <Typography.Paragraph style={{ maxWidth: 480, margin: 0 }} ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}>
                {s ?? '—'}
              </Typography.Paragraph>
            ),
          },
          { title: 'Updated', dataIndex: 'updatedAt', render: (d: string) => date(d) },
        ]}
      />
    </Card>
  );
}
