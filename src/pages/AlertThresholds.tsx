import { CheckCircleOutlined, ExclamationCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Drawer, Form, Input, InputNumber, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { label, useT, type Strings } from '../i18n';
import { api } from '../lib/api';
import { date, dateTime, NUM } from '../lib/format';
import { useParam } from '../lib/useParam';

interface Confirmation {
  confirmedByName: string | null;
  confirmedByRegistration: string | null;
  confirmedAt: string | null;
}

interface HistoryRow extends Confirmation {
  id: string;
  threshold: number;
  secondary: number | null;
  note: string | null;
  changedAt: string;
}

/** One row of GET /admin/alert-thresholds. */
interface ThresholdRow {
  kind: string;
  label: string;
  basis: 'operational' | 'vetUnconfirmed';
  codeDefault: { threshold: number | null; secondary: number | null };
  secondaryLabel: string | null;
  platform: (Confirmation & { threshold: number; secondary: number | null; note: string | null }) | null;
  effective: {
    threshold: number | null;
    secondary: number | null;
    basis: 'operational' | 'vetUnconfirmed' | 'vetConfirmed';
    confirmedBy: { name: string; registration: string; at: string } | null;
  };
  history: HistoryRow[];
}

interface FormValues {
  threshold: number | null;
  secondary: number | null;
  confirmedByName: string;
  confirmedByRegistration: string;
  note: string;
}

const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);

/** The status, as a tag with an icon and words, never colour alone. */
function StatusTag({ row, t }: { row: ThresholdRow; t: Strings }) {
  if (row.effective.basis === 'vetConfirmed')
    return (
      <Tag color="green" icon={<CheckCircleOutlined aria-hidden />}>
        {t.thrConfirmed}
      </Tag>
    );
  if (row.effective.basis === 'operational')
    return (
      <Tooltip title={t.thrOperationalHelp} mouseEnterDelay={0.5}>
        <Tag icon={<SettingOutlined aria-hidden />}>{t.thrOperational}</Tag>
      </Tooltip>
    );
  return (
    <Tag color="gold" icon={<ExclamationCircleOutlined aria-hidden />}>
      {t.thrNotConfirmed}
    </Tag>
  );
}

function EditDrawer({ row, onClose }: { row: ThresholdRow | undefined; onClose: () => void }) {
  const t = useT();
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm<FormValues>();
  const [dirty, setDirty] = useState(false);
  const name = Form.useWatch('confirmedByName', form);
  const reg = Form.useWatch('confirmedByRegistration', form);
  const vetKind = row?.basis === 'vetUnconfirmed';
  const kindName = row ? label(t.thrKindName, row.kind) : '';

  useEffect(() => {
    if (!row) return;
    // A new confirmation is typed fresh each time: the old one was for the old number.
    form.setFieldsValue({
      threshold: row.effective.threshold,
      secondary: row.effective.secondary,
      confirmedByName: '',
      confirmedByRegistration: '',
      note: row.platform?.note ?? '',
    });
    setDirty(false);
  }, [row, form]);

  const save = useMutation({
    mutationFn: (v: FormValues) =>
      api.request<ThresholdRow>('PUT', `/admin/alert-thresholds/${encodeURIComponent(row!.kind)}`, {
        threshold: v.threshold,
        ...(row?.secondaryLabel ? { secondary: v.secondary } : {}),
        ...(vetKind && v.confirmedByName?.trim()
          ? { confirmedByName: v.confirmedByName.trim(), confirmedByRegistration: v.confirmedByRegistration.trim() }
          : {}),
        note: v.note?.trim() || null,
      }),
    onSuccess: () => {
      message.success(t.thrSaved);
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['alert-thresholds'] });
    },
    onError: (e) => message.error((e as Error).message),
  });

  const close = () => {
    if (!dirty) return onClose();
    modal.confirm({ title: t.thrUnsaved, onOk: onClose });
  };

  // Typing in either vet field asks for the other.
  const bothOrNeither = (other: keyof FormValues) => ({
    validator: (_: unknown, v: string) =>
      !!v?.trim() === !!String(form.getFieldValue(other) ?? '').trim()
        ? Promise.resolve()
        : Promise.reject(new Error(t.thrVetBoth)),
  });
  const confirming = vetKind && !!name?.trim() && !!reg?.trim();

  return (
    <Drawer
      title={row ? t.thrEditFor(kindName) : ''}
      width={640}
      open={!!row}
      onClose={close}
      styles={{ body: { overscrollBehavior: 'contain' } }}
      destroyOnClose
    >
      {row && (
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <Typography.Text type="secondary">{label(t.thrMeaning, row.kind)}</Typography.Text>
          <Form<FormValues>
            form={form}
            layout="vertical"
            requiredMark={false}
            scrollToFirstError={{ focus: true }}
            onValuesChange={() => setDirty(true)}
            onFinish={(v) => save.mutate(v)}
          >
            <Form.Item
              name="threshold"
              label={t.thrThreshold}
              extra={t.thrCodeDefault(fmt(row.codeDefault.threshold))}
              rules={[{ required: true, type: 'number', min: 0, message: t.thrNeedNumber }]}
            >
              <InputNumber min={0} style={{ width: 200, ...NUM }} />
            </Form.Item>
            {row.secondaryLabel && (
              <Form.Item
                name="secondary"
                label={`${t.thrSecondary} · ${label(t.thrSecondaryMeaning, row.kind)}`}
                extra={t.thrCodeDefault(fmt(row.codeDefault.secondary))}
                rules={[{ type: 'number', min: 0, message: t.thrNeedNumber }]}
              >
                <InputNumber min={0} style={{ width: 200, ...NUM }} />
              </Form.Item>
            )}
            {vetKind && (
              <>
                <Typography.Paragraph type="secondary">{t.thrVetHelp}</Typography.Paragraph>
                <Space size={16} wrap style={{ width: '100%' }} align="start">
                  <Form.Item
                    name="confirmedByName"
                    label={t.thrVetName}
                    dependencies={['confirmedByRegistration']}
                    rules={[bothOrNeither('confirmedByRegistration')]}
                  >
                    <Input name="vet-name" autoComplete="off" placeholder={t.thrVetNamePlaceholder} maxLength={120} style={{ width: 260 }} />
                  </Form.Item>
                  <Form.Item
                    name="confirmedByRegistration"
                    label={t.thrVetReg}
                    dependencies={['confirmedByName']}
                    rules={[bothOrNeither('confirmedByName')]}
                  >
                    <Input
                      name="vet-registration"
                      autoComplete="off"
                      spellCheck={false}
                      translate="no"
                      placeholder={t.thrVetRegPlaceholder}
                      maxLength={64}
                      style={{ width: 220 }}
                    />
                  </Form.Item>
                </Space>
              </>
            )}
            <Form.Item name="note" label={t.thrNote}>
              <Input.TextArea
                rows={3}
                maxLength={1000}
                placeholder={t.thrNotePlaceholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) form.submit();
                }}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={save.isPending}>
              {confirming ? t.thrSaveConfirm : t.thrSave}
            </Button>
          </Form>

          <div>
            <Typography.Title level={2} style={{ fontSize: 15 }}>
              {t.thrHistory}
            </Typography.Title>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={row.history}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: t.thrNoHistory }}
              columns={[
                { title: t.thrChanged, dataIndex: 'changedAt', render: (v: string) => dateTime(v) },
                {
                  title: t.thrThreshold,
                  dataIndex: 'threshold',
                  align: 'right',
                  render: (v: number, h) => (
                    <span style={NUM}>
                      {fmt(v)}
                      {h.secondary != null && ` · ${fmt(h.secondary)}`}
                    </span>
                  ),
                },
                {
                  title: t.thrConfirmedCol,
                  key: 'vet',
                  render: (_, h) =>
                    h.confirmedByName && h.confirmedByRegistration ? (
                      <span style={{ overflowWrap: 'anywhere' }}>
                        {t.thrConfirmedBy(h.confirmedByName, h.confirmedByRegistration)}
                      </span>
                    ) : (
                      <Typography.Text type="secondary">{t.thrNotConfirmed}</Typography.Text>
                    ),
                },
                {
                  title: t.thrNote,
                  dataIndex: 'note',
                  render: (v: string | null) => <span style={{ overflowWrap: 'anywhere' }}>{v ?? '—'}</span>,
                },
              ]}
            />
          </div>
        </Space>
      )}
    </Drawer>
  );
}

/** Doc 19 §2: the platform default for every early warning, and the vet who confirmed it. */
export default function AlertThresholds() {
  const t = useT();
  const [openKind, setOpenKind] = useParam('kind');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alert-thresholds'],
    queryFn: () => api.get<ThresholdRow[]>('/admin/alert-thresholds'),
  });
  const open = data?.find((r) => r.kind === openKind);

  return (
    <Card title={<h1 style={{ fontSize: 16, margin: 0 }}>{t.navThresholds}</h1>}>
      <Typography.Paragraph type="secondary" style={{ maxWidth: '70ch' }}>
        {t.thrIntro}
      </Typography.Paragraph>
      {error && (
        <Alert
          type="error"
          message={(error as Error).message}
          showIcon
          style={{ marginBottom: 16 }}
          action={<Button onClick={() => refetch()}>{t.thrRetry}</Button>}
        />
      )}
      <Table
        rowKey="kind"
        loading={isLoading}
        dataSource={data ?? []}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: t.thrNone }}
        columns={[
          {
            title: t.thrKind,
            dataIndex: 'kind',
            render: (k: string) => (
              <Space direction="vertical" size={0} style={{ maxWidth: 360 }}>
                <Typography.Text strong>{label(t.thrKindName, k)}</Typography.Text>
                <Typography.Text type="secondary">{label(t.thrMeaning, k)}</Typography.Text>
              </Space>
            ),
          },
          {
            title: t.thrValue,
            key: 'value',
            align: 'right',
            render: (_, r) => (
              <Space direction="vertical" size={0} style={NUM}>
                <span>{fmt(r.effective.threshold)}</span>
                {r.effective.secondary != null && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t.thrSecondary}: {fmt(r.effective.secondary)}
                  </Typography.Text>
                )}
                {r.platform && r.platform.threshold !== r.codeDefault.threshold && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t.thrCodeDefault(fmt(r.codeDefault.threshold))}
                  </Typography.Text>
                )}
              </Space>
            ),
          },
          { title: t.colStatus, key: 'status', render: (_, r) => <StatusTag row={r} t={t} /> },
          {
            title: t.thrConfirmedCol,
            key: 'by',
            render: (_, r) =>
              r.effective.confirmedBy ? (
                <Space direction="vertical" size={0} style={{ maxWidth: 260 }}>
                  <span style={{ overflowWrap: 'anywhere' }}>
                    {t.thrConfirmedBy(r.effective.confirmedBy.name, r.effective.confirmedBy.registration)}
                  </span>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {date(r.effective.confirmedBy.at)}
                  </Typography.Text>
                </Space>
              ) : (
                '—'
              ),
          },
          {
            title: <span style={VISUALLY_HIDDEN}>{t.thrEditEllipsis}</span>,
            key: 'edit',
            render: (_, r) => (
              <Button
                aria-label={t.thrEditFor(label(t.thrKindName, r.kind))}
                onClick={() => setOpenKind(r.kind)}
              >
                {t.thrEditEllipsis}
              </Button>
            ),
          },
        ]}
      />
      <EditDrawer row={open} onClose={() => setOpenKind(undefined)} />
    </Card>
  );
}
