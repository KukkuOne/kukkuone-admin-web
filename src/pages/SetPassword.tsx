import { Alert, Button, Form, Input } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { useT } from '../i18n';
import { authApi, errorCode, errorStatus } from '../lib/api';

type Info = Awaited<ReturnType<typeof authApi.passwordToken>>;

const buttonLink = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40 } as const;

/** /set-password?token=…: the link from the welcome or reset email. */
export function SetPassword() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  // Read once and kept in state, then dropped from the address bar and history.
  const [token] = useState(() => params.get('token') ?? '');
  const [info, setInfo] = useState<Info | null | 'expired'>(token ? null : 'expired');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (params.has('token')) setParams({}, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    if (token) authApi.passwordToken(token).then(setInfo, () => setInfo('expired'));
  }, [token]);

  const submit = async ({ password }: { password: string }) => {
    setFormError(null);
    setBusy(true);
    try {
      await authApi.setPassword(token, password);
      setDone(true);
    } catch (e) {
      if (errorStatus(e) === 410) setInfo('expired');
      else setFormError(t.authErrors[errorCode(e) ?? ''] ?? t.authFailed);
    } finally {
      setBusy(false);
    }
  };

  if (info === null) return <AuthCard title={t.pwTitle} lead={t.pwChecking} />;
  if (info === 'expired')
    return (
      <AuthCard title={t.pwExpiredTitle} lead={t.pwExpiredLead}>
        <Link to="/forgot-password" className="ant-btn ant-btn-primary ant-btn-lg ant-btn-block" style={buttonLink}>
          {t.pwEmailNew}
        </Link>
      </AuthCard>
    );
  if (done)
    return (
      <AuthCard title={t.pwDoneTitle} lead={t.pwDoneLead(info.email, info.purpose === 'welcome')}>
        <Link to="/" className="ant-btn ant-btn-primary ant-btn-lg ant-btn-block" style={buttonLink}>
          {t.pwGoSignIn}
        </Link>
      </AuthCard>
    );
  return (
    <AuthCard title={info.purpose === 'welcome' ? t.pwWelcomeTitle : t.pwResetTitle} lead={t.pwLead(info.email)}>
      <Form layout="vertical" requiredMark={false} onFinish={submit} scrollToFirstError={{ focus: true }}>
        {/* For password managers: which account this new password belongs to. */}
        <input type="email" name="username" autoComplete="username" value={info.email} readOnly hidden />
        <Form.Item
          name="password"
          label={t.pwNew}
          rules={[
            { required: true, min: 12, message: t.pwMin },
            { max: 200, message: t.pwMax },
          ]}
        >
          <Input.Password autoComplete="new-password" autoFocus size="large" />
        </Form.Item>
        <Form.Item
          name="confirm"
          label={t.pwAgain}
          dependencies={['password']}
          rules={[
            ({ getFieldValue }) => ({
              validator: (_, v) => (v === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error(t.pwMismatch))),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" size="large" />
        </Form.Item>
        {formError && <Alert type="error" showIcon message={formError} style={{ marginBottom: 16 }} />}
        <Button type="primary" htmlType="submit" size="large" block loading={busy}>
          {t.pwSubmit}
        </Button>
      </Form>
    </AuthCard>
  );
}

/** /forgot-password: emails a set-password link; the answer is the same whether or not the account exists. */
export function ForgotPassword() {
  const t = useT();
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async ({ email }: { email: string }) => {
    setFormError(null);
    setBusy(true);
    try {
      await authApi.passwordLink(email.trim());
      setSent(email.trim());
    } catch (e) {
      setFormError(t.authErrors[errorCode(e) ?? ''] ?? t.authFailed);
    } finally {
      setBusy(false);
    }
  };

  if (sent)
    return (
      <AuthCard title={t.fpSentTitle} lead={t.fpSentLead(sent)}>
        <Link to="/">{t.fpBack}</Link>
      </AuthCard>
    );
  return (
    <AuthCard title={t.fpTitle} lead={t.fpLead}>
      <Form layout="vertical" requiredMark={false} onFinish={submit} scrollToFirstError={{ focus: true }}>
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
        {formError && <Alert type="error" showIcon message={formError} style={{ marginBottom: 16 }} />}
        <Button type="primary" htmlType="submit" size="large" block loading={busy}>
          {t.fpSubmit}
        </Button>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/">{t.fpBack}</Link>
        </div>
      </Form>
    </AuthCard>
  );
}
