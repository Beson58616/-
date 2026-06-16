import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Space, Typography, Input, Button, theme } from 'antd';
import {
  DashboardOutlined,
  AimOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  RiseOutlined,
  AuditOutlined,
  SafetyOutlined,
  UserOutlined,
  BellOutlined,
  SearchOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { collabAPI } from '../services/api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/home', icon: <DashboardOutlined />, label: '首页总览' },
  { key: '/strategy', icon: <AimOutlined />, label: '策略中心' },
  { key: '/content', icon: <FileTextOutlined />, label: '内容中心' },
  { key: '/channel', icon: <ShareAltOutlined />, label: '渠道中心' },
  { key: '/growth', icon: <RiseOutlined />, label: '增长转化中心' },
  { key: '/review', icon: <AuditOutlined />, label: '复盘中心' },
  { key: '/risk', icon: <SafetyOutlined />, label: '风控与协作中心' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: { colorBgContainer } } = theme.useToken();

  // Fetch unread notifications
  useEffect(() => {
    collabAPI.getNotifications({ unread: 'true', pageSize: '1' }).then(res => {
      setUnreadCount(res.data.data.total);
    }).catch(() => {});
    const interval = setInterval(() => {
      collabAPI.getNotifications({ unread: 'true', pageSize: '1' }).then(res => {
        setUnreadCount(res.data.data.total);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentKey = '/' + location.pathname.split('/')[1];

  const userMenu = {
    items: [
      { key: 'profile', label: `${user?.displayName || user?.username}`, disabled: true },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') logout();
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        style={{ background: colorBgContainer, borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0', padding: '0 16px',
        }}>
          <Text strong style={{ fontSize: collapsed ? 14 : 16, whiteSpace: 'nowrap', color: '#1677ff' }}>
            {collapsed ? '📊' : '📊 新媒体驾驶舱'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: colorBgContainer, padding: '0 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0', height: 64,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Space size="large">
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索选题、脚本、任务..."
              style={{ width: 280 }}
              onPressEnter={(e) => {
                const val = (e.target as HTMLInputElement).value;
                if (val) navigate(`/content?search=${encodeURIComponent(val)}`);
              }}
            />
            <Badge count={unreadCount} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => navigate('/risk')} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <Text>{user?.displayName || user?.username}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
