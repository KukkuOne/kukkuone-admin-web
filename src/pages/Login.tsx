import { Button, Card, Form, Input, Typography } from 'antd';
import { useAuth } from '../lib/auth';

/**
 * Dev sign-in: enter an email → the app uses a `dev:<email>` token.
 * Admin pages require the super-admin (naptrixlabs@gmail.com). When AUTH_PROVIDER
 * switches to firebase, this screen is replaced by Google sign-in.
 */
export default function Login() {
  const { login, mode } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fafafa' }}>
      <Card style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36 }}>🐔</div>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            KukkuOne Admin
          </Typography.Title>
          <Typography.Text type="secondary">Platform owner console</Typography.Text>
        </div>
        {mode === 'firebase' ? (
          <div style={{ textAlign: 'center' }}>
            <Button type="primary" size="large" block onClick={() => void login()}>
              Sign in with Google
            </Button>
          </div>
        ) : (
        <Form layout="vertical" initialValues={{ email: 'naptrixlabs@gmail.com' }} onFinish={(v) => login(v.email)}>
          <Form.Item
            name="email"
            label="Email (dev sign-in)"
            rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
          >
            <Input placeholder="naptrixlabs@gmail.com" size="large" autoFocus />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block>
            Enter
          </Button>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
            Use <b>naptrixlabs@gmail.com</b> for full access. Other emails will be denied by the admin API.
          </Typography.Paragraph>
        </Form>
        )}
      </Card>
    </div>
  );
}
