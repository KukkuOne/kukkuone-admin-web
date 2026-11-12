import {
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  BarChartOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  LineChartOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  ReadOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Tag, Typography } from 'antd';
import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const { Sider, Header, Content } = Layout;

const NAV = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
  { key: '/organizations', icon: <BankOutlined />, label: 'Organizations' },
  { key: '/farms', icon: <EnvironmentOutlined />, label: 'Farms' },
  { key: '/batches', icon: <AppstoreOutlined />, label: 'Batches' },
  { key: '/users', icon: <TeamOutlined />, label: 'Users' },
  { key: '/vets', icon: <MedicineBoxOutlined />, label: 'Vets' },
  { key: '/diseases', icon: <ReadOutlined />, label: 'Disease catalogue' },
  { key: '/market-rates', icon: <LineChartOutlined />, label: 'Market rates' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: 'Partner orders' },
  { key: '/audit', icon: <AuditOutlined />, label: 'Audit log' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { email, logout } = useAuth();
  const current = NAV.find((n) => n.key === location.pathname) ?? NAV[0];
  const selected = current.key;

  useEffect(() => {
    document.title = `${current.label} · KukkuOne Admin`;
  }, [current.label]);

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
          items={NAV.map((n) => ({ ...n, label: <Link to={n.key}>{n.label}</Link> }))}
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
            Platform Admin
          </Typography.Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tag color="volcano">SUPER ADMIN</Tag>
            <Dropdown
              menu={{
                items: [{ key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', onClick: logout }],
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
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
