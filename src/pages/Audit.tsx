import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Input, Select, Space } from 'antd';
import AuditTable, { type AuditRow } from '../components/AuditTable';
import { useT } from '../i18n';
import { api } from '../lib/api';
import { useParam } from '../lib/useParam';

interface OrgOption {
  id: string;
  name: string;
}

/** The latest 200 audit rows across the platform, narrowed by organization or resource. */
export default function Audit() {
  const t = useT();
  const [orgId, setOrgId] = useParam('org');
  const [resource, setResource] = useParam('resource');
  const orgs = useQuery({ queryKey: ['organizations', undefined], queryFn: () => api.get<OrgOption[]>('/admin/organizations') });
  const qs = new URLSearchParams({ ...(orgId ? { orgId } : {}), ...(resource ? { resource } : {}) }).toString();
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', orgId, resource],
    queryFn: () => api.get<AuditRow[]>(`/admin/audit${qs ? `?${qs}` : ''}`),
  });

  return (
    <Card
      title={<h1 style={{ fontSize: 16, margin: 0 }}>{t.navAudit}</h1>}
      extra={
        <Space wrap>
          <Select
            aria-label={t.colOrg}
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={t.allOrgs}
            style={{ width: 220 }}
            value={orgId}
            onChange={(v) => setOrgId(v)}
            options={(orgs.data ?? []).map((o) => ({ value: o.id, label: o.name }))}
          />
          <Input.Search
            aria-label={t.auditResource}
            placeholder={t.auditResourcePlaceholder}
            allowClear
            spellCheck={false}
            defaultValue={resource}
            onSearch={(v) => setResource(v.trim() || undefined)}
            style={{ width: 200 }}
          />
        </Space>
      }
    >
      {error && <Alert type="error" message={(error as Error).message} showIcon style={{ marginBottom: 16 }} />}
      <AuditTable rows={data ?? []} loading={isLoading} showOrg={!orgId} />
    </Card>
  );
}
