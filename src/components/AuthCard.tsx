import { Card, Typography } from 'antd';
import { useEffect, type ReactNode } from 'react';
import { LangSwitch, useT } from '../i18n';

/** The frame every signed-out page shares: brand, language, one card. */
export default function AuthCard({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  const t = useT();
  useEffect(() => {
    document.title = t.docTitle(title);
  }, [t, title]);

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#fafafa', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16 }}>
          <Typography.Text strong style={{ fontSize: 16 }}>
            <span aria-hidden>🐔 </span>
            <span translate="no">{t.appName}</span>
          </Typography.Text>
          <LangSwitch />
        </div>
        <Card>
          <Typography.Title level={1} style={{ fontSize: 20, marginTop: 0, marginBottom: lead ? 4 : 16 }}>
            {title}
          </Typography.Title>
          {lead && (
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16, textWrap: 'pretty' }}>
              {lead}
            </Typography.Paragraph>
          )}
          {children}
        </Card>
      </div>
    </main>
  );
}
