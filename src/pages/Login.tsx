import { Button, Card, Form, Input, Typography } from 'antd';
import { LangSwitch, useT } from '../i18n';
import { useAuth } from '../lib/auth';

/**
 * Dev sign-in: enter an email → the app uses a `dev:<email>` token.
 * Admin pages require the super-admin (naptrixlabs@gmail.com). When AUTH_PROVIDER
 * switches to firebase, this screen is replaced by Google sign-in.
 */
export default function Login() {
  const { login, mode } = useAuth();
  const t = useT();

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fafafa' }}>
      <Card style={{ width: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <LangSwitch />
        </div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36 }}>🐔</div>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            {t.appName}
          </Typography.Title>
          <Typography.Text type="secondary">{t.consoleTagline}</Typography.Text>
        </div>
        {mode === 'firebase' ? (
          <div style={{ textAlign: 'center' }}>
            <Button type="primary" size="large" block onClick={() => void login()}>
              {t.signInWithGoogle}
            </Button>
          </div>
        ) : (
        <Form layout="vertical" initialValues={{ email: 'naptrixlabs@gmail.com' }} onFinish={(v) => login(v.email)}>
          <Form.Item
            name="email"
            label={t.devEmailLabel}
            rules={[{ required: true, type: 'email', message: t.devEmailInvalid }]}
          >
            <Input placeholder="naptrixlabs@gmail.com" size="large" autoFocus />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block>
            {t.devEnter}
          </Button>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
            {t.devHint(<b key="email">naptrixlabs@gmail.com</b>)}
          </Typography.Paragraph>
        </Form>
        )}
      </Card>
    </div>
  );
}
