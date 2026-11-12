import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Input, Table, Tag, Typography } from 'antd';
import { useLang } from '../i18n';
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
  const { t, lang } = useLang();
  // In Telugu the name is the Telugu one where the seed carries it; the other column shows the other language.
  const te = lang === 'te';
  const [q, setQ] = useParam('q');
  const { data, isLoading, error } = useQuery({ queryKey: ['diseases'], queryFn: () => api.get<Disease[]>('/admin/diseases') });
  const needle = q?.toLowerCase();
  const rows = (data ?? []).filter(
    (d) => !needle || d.name.toLowerCase().includes(needle) || d.code.toLowerCase().includes(needle) || (d.nameTe ?? '').includes(q!),
  );

  return (
    <Card
      title={<h1 style={{ fontSize: 16, margin: 0 }}>{t.navDiseases}</h1>}
      extra={
        <Input.Search
          placeholder={t.disSearchPlaceholder}
          aria-label={t.disSearchLabel}
          allowClear
          spellCheck={false}
          defaultValue={q}
          onSearch={(v) => setQ(v.trim() || undefined)}
          style={{ width: 240 }}
        />
      }
    >
      <Typography.Paragraph type="secondary">
        {t.disReadOnly}
      </Typography.Paragraph>
      {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: q ? t.disNoMatch : t.disEmpty }}
        columns={[
          { title: t.disCode, dataIndex: 'code', render: (c: string) => <Typography.Text code translate="no">{c}</Typography.Text> },
          { title: t.colName, key: 'name', render: (_, d: Disease) => (te ? <span lang="te">{d.nameTe ?? d.name}</span> : d.name) },
          {
            title: t.disOtherName,
            key: 'other',
            render: (_, d: Disease) => (te ? <span lang="en">{d.name}</span> : <span lang="te">{d.nameTe ?? '—'}</span>),
          },
          { title: t.disNotifiable, dataIndex: 'notifiable', render: (n: boolean) => (n ? <Tag color="red">{t.disNotifiable}</Tag> : '—') },
          {
            title: t.disSummary,
            dataIndex: 'summary',
            render: (s: string | null) => (
              <Typography.Paragraph style={{ maxWidth: 480, margin: 0 }} ellipsis={{ rows: 2, expandable: true, symbol: t.more }}>
                {s ?? '—'}
              </Typography.Paragraph>
            ),
          },
          { title: t.disUpdated, dataIndex: 'updatedAt', render: (d: string) => date(d) },
        ]}
      />
    </Card>
  );
}
