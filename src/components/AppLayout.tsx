import {
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  BarChartOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  LineChartOutlined,
  LogoutOutlined,
  StopOutlined,
  MedicineBoxOutlined,
  ReadOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { App, Avatar, Dropdown, Layout, Menu, Tag, Typography } from 'antd';
import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LangSwitch, useT } from '../i18n';
import { authApi } from '../lib/api';
import { useAuth } from '../lib/auth';

const { Sider, Header, Content } = Layout;

const NAV = [
  { key: '/', icon: <DashboardOutlined />, label: 'navDashboard' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'navReports' },
  { key: '/organizations', icon: <BankOutlined />, label: 'navOrgs' },
  { key: '/farms', icon: <EnvironmentOutlined />, label: 'navFarms' },
  { key: '/batches', icon: <AppstoreOutlined />, label: 'navBatches' },
  { key: '/users', icon: <TeamOutlined />, label: 'navUsers' },
  { key: '/vets', icon: <MedicineBoxOutlined />, label: 'navVets' },
  { key: '/diseases', icon: <ReadOutlined />, label: 'navDiseases' },
  { key: '/market-rates', icon: <LineChartOutlined />, label: 'navRates' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: 'navOrders' },
  { key: '/audit', icon: <AuditOutlined />, label: 'navAudit' },
] as const;

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { email, logout } = useAuth();
  const t = useT();
  const { message } = App.useApp();
  const current = NAV.find((n) => n.key === location.pathname) ?? NAV[0];
  const selected = current.key;

  const title = t[current.label];

  useEffect(() => {
    document.title = t.docTitle(title);
  }, [t, title]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={230} breakpoint="lg" collapsedWidth={64}>
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 20px',
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>🐔</span>
          <Typography.Text strong style={{ color: '#fff', fontSize: 16, whiteSpace: 'nowrap' }}>
            KukkuOne
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selected]}
          items={NAV.map((n) => ({ ...n, label: <Link to={n.key}>{t[n.label]}</Link> }))}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t.platformAdmin}
          </Typography.Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LangSwitch />
            <Tag color="volcano">{t.superAdmin}</Tag>
            <Dropdown
              menu={{
                items: [
                  { key: 'logout', icon: <LogoutOutlined />, label: t.signOut, onClick: logout },
                  {
                    key: 'logout-all',
                    icon: <StopOutlined />,
                    label: t.signOutEverywhere,
                    onClick: () =>
                      authApi.logoutAll().then(logout, (e) => message.error((e as Error).message)),
                  },
                ],
              }}
            >
              <div
                role="button"
                tabIndex={0}
                aria-label={t.accountMenu(email ?? '')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <Avatar style={{ backgroundColor: '#c2410c' }}>{email?.[0]?.toUpperCase()}</Avatar>
                <span>{email}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
