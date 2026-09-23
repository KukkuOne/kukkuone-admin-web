import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  LogoutOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const { Sider, Header, Content } = Layout;

const NAV = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
  { key: '/organizations', icon: <BankOutlined />, label: 'Organizations' },
  { key: '/farms', icon: <EnvironmentOutlined />, label: 'Farms' },
  { key: '/batches', icon: <AppstoreOutlined />, label: 'Batches' },
  { key: '/users', icon: <TeamOutlined />, label: 'Users' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, logout } = useAuth();
  const selected = NAV.find((n) => n.key === location.pathname)?.key ?? '/';

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
          items={NAV}
          onClick={({ key }) => navigate(key)}
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
