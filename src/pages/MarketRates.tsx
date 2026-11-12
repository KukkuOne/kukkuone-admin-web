import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Col, Row, Select, Table, Typography } from 'antd';
import { useT } from '../i18n';
import { api } from '../lib/api';
import { date, money, NUM } from '../lib/format';
import { useParam } from '../lib/useParam';

interface BroilerRate {
  id: string;
  region: string;
  date: string;
  rate: number;
  source: string | null;
  publishedBy: string | null;
}
interface ChickRate {
  id: string;
  onDate: string;
  paisePerChick: number;
  publishedBy: string | null;
}

/** Published rates, read-only. Trading partners publish them from their own app. */
export default function MarketRates() {
  const t = useT();
  const [region, setRegion] = useParam('region');
  const [days, setDays] = useParam('days');
  const { data, isLoading, error } = useQuery({
    queryKey: ['market-rates', days],
    queryFn: () => api.get<{ broiler: BroilerRate[]; chick: ChickRate[] }>(`/admin/market-rates?days=${days ?? 60}`),
  });
  const regions = Array.from(new Set((data?.broiler ?? []).map((r) => r.region))).sort();
  const broiler = (data?.broiler ?? []).filter((r) => !region || r.region === region);

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Typography.Title level={1} style={{ fontSize: 20, margin: 0 }}>
          {t.navRates}
        </Typography.Title>
        <Typography.Text type="secondary">{t.rateSub}</Typography.Text>
        {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginTop: 16 }} />}
      </Col>
      <Col xs={24} lg={15}>
        <Card
          size="small"
          title={t.rateBroiler}
          extra={
            <span style={{ display: 'flex', gap: 8 }}>
              <Select
                aria-label={t.rateRegion}
                allowClear
                placeholder={t.rateAllRegions}
                style={{ width: 180 }}
                value={region}
                onChange={(v) => setRegion(v)}
                options={regions.map((r) => ({ value: r, label: r }))}
              />
              <Select
                aria-label={t.ratePeriod}
                style={{ width: 130 }}
                value={days ?? '60'}
                onChange={(v) => setDays(v)}
                options={['30', '60', '90', '180', '365'].map((d) => ({ value: d, label: t.rateLastDays(d) }))}
              />
            </span>
          }
        >
          <Table
            rowKey="id"
            size="small"
            loading={isLoading}
            dataSource={broiler}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: t.rateNoBroiler }}
            columns={[
              { title: t.colDate, dataIndex: 'date', render: (d: string) => date(d) },
              { title: t.rateRegion, dataIndex: 'region' },
              { title: t.ratePerKg, dataIndex: 'rate', align: 'right', render: (p: number) => <span style={NUM}>{money(p)}</span> },
              { title: t.rateSource, dataIndex: 'source', render: (s: string | null) => s ?? '—' },
            ]}
          />
        </Card>
      </Col>
      <Col xs={24} lg={9}>
        <Card size="small" title={t.rateChick}>
          <Table
            rowKey="id"
            size="small"
            loading={isLoading}
            dataSource={data?.chick ?? []}
            locale={{ emptyText: t.rateNoChick }}
            columns={[
              { title: t.colDate, dataIndex: 'onDate', render: (d: string) => date(d) },
              { title: t.rateRate, dataIndex: 'paisePerChick', align: 'right', render: (p: number) => <span style={NUM}>{money(p)}</span> },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}
