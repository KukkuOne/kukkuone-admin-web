import { ArrowLeftOutlined, SafetyOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, QRCode, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { useT } from '../i18n';
import { authApi, errorCode, type LoginResponse } from '../lib/api';
import { useAuth } from '../lib/auth';

const digits = (v: string) => v.replace(/\D/g, '');

/**
 * Email + password, then a 6-digit code from an authenticator app — enrolled
 * here, by QR, on the first sign-in. Mirrors the Vihara admin's staff sign-in.
 */
export default function SignIn() {
  const t = useT();
  const { signIn, ended } = useAuth();
  const [challenge, setChallenge] = useState<(LoginResponse & { email: string }) | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Kept across the code step, so going back keeps the email typed.
  const [credsForm] = Form.useForm<{ email: string; password: string }>();
  const message = (e: unknown) => t.authErrors[errorCode(e) ?? ''] ?? t.authFailed;

  const submitCreds = async ({ email, password }: { email: string; password: string }) => {
    setFormError(null);
    setBusy(true);
    try {
      const em = email.trim();
      setChallenge({ ...(await authApi.login(em, password)), email: em });
    } catch (e) {
      setFormError(message(e));
    } finally {
      setBusy(false);
    }
  };

  const [codeForm] = Form.useForm<{ code: string }>();
  const submitCode = async ({ code }: { code: string }) => {
    if (!challenge) return;
    setFormError(null);
    setBusy(true);
    try {
      const res = await authApi.verify(challenge.challenge_id, digits(code));
      signIn(res.token, res.expiresAt, res.staff);
    } catch (e) {
      const c = errorCode(e);
      if (c === 'CHALLENGE_EXPIRED' || c === 'ACCOUNT_LOCKED') {
        // Nothing more to try against this challenge: back to the password.
        setChallenge(null);
        setFormError(message(e));
      } else {
        codeForm.setFields([{ name: 'code', errors: [message(e)] }]);
        codeForm.getFieldInstance('code')?.focus?.();
      }
    } finally {
      setBusy(false);
    }
  };

  if (!challenge) {
    return (
      <AuthCard title={t.authTitle} lead={t.authLead}>
        {ended && <Alert type="info" showIcon role="status" message={t.authSessionEnded} style={{ marginBottom: 16 }} />}
        <Form form={credsForm} layout="vertical" requiredMark={false} onFinish={submitCreds} scrollToFirstError={{ focus: true }}>
          <Form.Item
            name="email"
            label={t.authEmail}
            rules={[
              { required: true, whitespace: true, message: t.authEmailRequired },
              { type: 'email', transform: (v: string) => v?.trim(), message: t.authEmailInvalid },
            ]}
          >
            <Input type="email" autoComplete="username" spellCheck={false} autoFocus size="large" placeholder={t.authEmailPlaceholder} />
          </Form.Item>
          <Form.Item name="password" label={t.authPassword} rules={[{ required: true, message: t.authPasswordRequired }]}>
            <Input.Password autoComplete="current-password" size="large" />
          </Form.Item>
          {formError && <Alert type="error" showIcon message={formError} style={{ marginBottom: 16 }} />}
          <Button type="primary" htmlType="submit" size="large" block loading={busy}>
            {t.authContinue}
          </Button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/forgot-password">{t.authForgot}</Link>
          </div>
        </Form>
      </AuthCard>
    );
  }

  const enrolling = !challenge.totp_enrolled && challenge.totp_enrolment;
  return (
    <AuthCard title={challenge.totp_enrolled ? t.authEnterCode : t.authSetUp} lead={challenge.totp_enrolled ? t.authCodeLead : t.authEnrolLead}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        aria-label={t.authChangeEmail(challenge.email)}
        onClick={() => {
          setChallenge(null);
          setFormError(null);
        }}
        style={{ padding: 0, marginBottom: 12, maxWidth: '100%', height: 'auto', minHeight: 24 }}
      >
        <span style={{ overflowWrap: 'anywhere', whiteSpace: 'normal', textAlign: 'left' }}>{challenge.email}</span>
      </Button>
      {enrolling && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: '#fafafa', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, textAlign: 'center', margin: 0, maxWidth: '34ch' }}>
            {t.authNoApp}
          </Typography.Paragraph>
          {/* Drawn here, in the browser: the secret is never sent to a QR service. White quiet zone so it scans anywhere. */}
          <div role="img" aria-label={t.authQrLabel}>
            <QRCode value={challenge.totp_enrolment!.otpauth_url} size={176} bgColor="#ffffff" color="#000000" errorLevel="M" type="svg" bordered={false} />
          </div>
          <details style={{ width: '100%', textAlign: 'center', fontSize: 12 }}>
            <summary style={{ cursor: 'pointer', minHeight: 24 }}>{t.authCantScan}</summary>
            <Typography.Text
              copyable
              translate="no"
              style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, letterSpacing: '0.12em', wordBreak: 'break-all', fontVariantNumeric: 'tabular-nums' }}
            >
              {challenge.totp_enrolment!.secret}
            </Typography.Text>
          </details>
        </div>
      )}
      {challenge.totp_enrolled && (
        <details style={{ fontSize: 12, marginBottom: 16 }}>
          <summary style={{ cursor: 'pointer', minHeight: 24 }}>{t.authCantAccess}</summary>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
            {t.authCantAccessBody}
          </Typography.Paragraph>
        </details>
      )}
      <Form form={codeForm} layout="vertical" requiredMark={false} onFinish={submitCode} scrollToFirstError={{ focus: true }}>
        <Form.Item
          name="code"
          label={t.authCode}
          rules={[{ validator: (_, v: string = '') => (/^\d{6}$/.test(digits(v)) ? Promise.resolve() : Promise.reject(new Error(t.authCodeInvalid))) }]}
        >
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            spellCheck={false}
            autoFocus
            size="large"
            style={{ textAlign: 'center', fontSize: 20, letterSpacing: '0.4em', fontVariantNumeric: 'tabular-nums' }}
          />
        </Form.Item>
        {formError && <Alert type="error" showIcon message={formError} style={{ marginBottom: 16 }} />}
        <Button type="primary" htmlType="submit" size="large" block loading={busy} icon={<SafetyOutlined />}>
          {t.authVerify}
        </Button>
      </Form>
    </AuthCard>
  );
}
