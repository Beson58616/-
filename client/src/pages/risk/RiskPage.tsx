import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Button, Modal, Form, Input, Select, DatePicker, Space, Tabs, List, Badge, message, Popconfirm, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, BellOutlined, SafetyOutlined, AuditOutlined, TeamOutlined } from '@ant-design/icons';
import { collabAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusLabels: Record<string, string> = {
  todo: '待办', in_progress: '进行中', review: '审核中', done: '已完成', cancelled: '已取消',
  pending: '待审批', approved: '已通过', rejected: '已拒绝',
};

const statusColors: Record<string, string> = {
  todo: 'default', in_progress: 'blue', review: 'orange', done: 'green', cancelled: 'default',
  pending: 'orange', approved: 'green', rejected: 'red',
};

const priorityLabels: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' };
const priorityColors: Record<string, string> = { low: 'default', medium: 'blue', high: 'orange', urgent: 'red' };

const notifTypeLabels: Record<string, string> = {
  task: '任务', approval: '审批', mention: '提及', system: '系统', alert: '告警',
};

export default function RiskPage() {
  const user = useAuthStore(s => s.user);
  const [tasks, setTasks] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [taskModal, setTaskModal] = useState({ open: false, record: null as any });
  const [taskForm] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      collabAPI.getTasks({ pageSize: '100' }),
      collabAPI.getApprovals({ pageSize: '100' }),
      collabAPI.getNotifications({ pageSize: '50' }),
    ]).then(([t, a, n]) => {
      setTasks(t.data.data.list);
      setApprovals(a.data.data.list);
      setNotifications(n.data.data.list);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveTask = async (values: any) => {
    const data = { ...values, dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : '' };
    if (taskModal.record) {
      await collabAPI.updateTask(taskModal.record.id, data);
      message.success('任务更新成功');
    } else {
      await collabAPI.createTask(data);
      message.success('任务创建成功');
    }
    setTaskModal({ open: false, record: null });
    fetchData();
  };

  const handleDeleteTask = async (id: string) => {
    await collabAPI.deleteTask(id);
    message.success('已删除');
    fetchData();
  };

  const handleApprove = async (id: string, status: string) => {
    await collabAPI.updateApproval(id, { status, comment: status === 'approved' ? '同意' : '驳回' });
    message.success(status === 'approved' ? '已通过' : '已驳回');
    fetchData();
  };

  const handleMarkRead = async (id: string) => {
    await collabAPI.markRead(id);
    fetchData();
  };

  const handleMarkAllRead = async () => {
    await collabAPI.markAllRead();
    message.success('全部标记为已读');
    fetchData();
  };

  const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length;
  const pendingApprovals = approvals.filter(a => a.status === 'pending').length;
  const unreadNotifs = notifications.filter(n => n.is_read === 0).length;

  const tabItems = [
    {
      key: 'tasks', label: <Badge count={pendingTasks} size="small" offset={[8, 0]}><span>📋 任务管理</span></Badge>,
      children: (
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { taskForm.resetFields(); setTaskModal({ open: true, record: null }); }} style={{ marginBottom: 16 }}>
            新建任务
          </Button>
          <Table
            dataSource={tasks}
            rowKey="id"
            loading={loading}
            columns={[
              { title: '任务标题', dataIndex: 'title', ellipsis: true, width: 200 },
              { title: '负责人', dataIndex: 'assignee_name', width: 100 },
              { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag> },
              { title: '优先级', dataIndex: 'priority', width: 80, render: (v: string) => <Tag color={priorityColors[v]}>{priorityLabels[v]}</Tag> },
              { title: '截止日期', dataIndex: 'due_date', width: 110, render: (v: string) => v ? <Text type={v < dayjs().format('YYYY-MM-DD') ? 'danger' : undefined}>{v}</Text> : '-' },
              { title: '创建者', dataIndex: 'creator_name', width: 100 },
              {
                title: '操作', width: 220, render: (_: any, r: any) => (
                  <Space>
                    {r.status === 'todo' && (
                      <Button size="small" type="primary" onClick={() => collabAPI.updateTask(r.id, { status: 'in_progress' }).then(fetchData)}>开始</Button>
                    )}
                    {r.status === 'in_progress' && (
                      <Button size="small" type="primary" onClick={() => collabAPI.updateTask(r.id, { status: 'done' }).then(fetchData)}>完成</Button>
                    )}
                    <Button size="small" icon={<EditOutlined />} onClick={() => { taskForm.setFieldsValue({ ...r, dueDate: r.due_date ? dayjs(r.due_date) : undefined }); setTaskModal({ open: true, record: r }); }}>编辑</Button>
                    <Popconfirm title="确定删除?" onConfirm={() => handleDeleteTask(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'approvals', label: <Badge count={pendingApprovals} size="small" offset={[8, 0]}><span>✅ 审批中心</span></Badge>,
      children: (
        <div>
          <Table
            dataSource={approvals}
            rowKey="id"
            loading={loading}
            columns={[
              { title: '审批标题', dataIndex: 'title', ellipsis: true },
              { title: '类型', dataIndex: 'content_type', width: 80, render: (v: string) => {
                const m: Record<string, string> = { topic: '选题', script: '脚本', content_plan: '排期', publish: '发布', other: '其他' };
                return <Tag>{m[v] || v}</Tag>;
              }},
              { title: '申请人', dataIndex: 'requester_name', width: 100 },
              { title: '审批人', dataIndex: 'approver_name', width: 100 },
              { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag> },
              { title: '评论', dataIndex: 'comment', ellipsis: true, width: 150 },
              { title: '时间', dataIndex: 'created_at', width: 120, render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
              {
                title: '操作', width: 160, render: (_: any, r: any) => (
                  r.status === 'pending' ? (
                    <Space>
                      <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(r.id, 'approved')}>通过</Button>
                      <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleApprove(r.id, 'rejected')}>驳回</Button>
                    </Space>
                  ) : <Text type="secondary">{statusLabels[r.status]}</Text>
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'notifications', label: <Badge count={unreadNotifs} size="small" offset={[8, 0]}><span>🔔 通知中心</span></Badge>,
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Button onClick={handleMarkAllRead} disabled={unreadNotifs === 0}>全部已读</Button>
          </Space>
          <List
            dataSource={notifications}
            renderItem={(item: any) => (
              <List.Item
                style={{ background: item.is_read ? 'transparent' : '#f0f5ff', padding: '8px 16px', borderRadius: 8, marginBottom: 4 }}
                actions={[
                  !item.is_read && <Button size="small" type="link" onClick={() => handleMarkRead(item.id)}>标记已读</Button>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<Tag color={item.type === 'task' ? 'blue' : item.type === 'approval' ? 'orange' : item.type === 'alert' ? 'red' : 'default'}>{notifTypeLabels[item.type] || item.type}</Tag>}
                  title={item.title}
                  description={<Text type="secondary">{item.message} · {dayjs(item.created_at).format('MM-DD HH:mm')}</Text>}
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无通知' }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>🛡️ 风控与协作中心</Title>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card><Statistic title="待办任务" value={pendingTasks} prefix={<TeamOutlined />} valueStyle={{ color: pendingTasks > 0 ? '#fa8c16' : '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="待审批" value={pendingApprovals} prefix={<AuditOutlined />} valueStyle={{ color: pendingApprovals > 0 ? '#ff4d4f' : '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="未读通知" value={unreadNotifs} prefix={<BellOutlined />} valueStyle={{ color: unreadNotifs > 0 ? '#1677ff' : '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="已完成任务" value={tasks.filter(t => t.status === 'done').length} prefix={<CheckOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      <Tabs items={tabItems} />

      {/* Task Modal */}
      <Modal title={taskModal.record ? '编辑任务' : '新建任务'} open={taskModal.open}
        onCancel={() => setTaskModal({ open: false, record: null })} onOk={() => taskForm.submit()} width={600}
      >
        <Form form={taskForm} layout="vertical" onFinish={handleSaveTask}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><TextArea rows={3} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级"><Select options={Object.entries(priorityLabels).map(([k, v]) => ({ label: v, value: k }))} /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态"><Select options={Object.entries(statusLabels).filter(([k]) => ['todo','in_progress','review','done','cancelled'].includes(k)).map(([k, v]) => ({ label: v, value: k }))} /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="assigneeId" label="负责人ID"><Input placeholder="输入用户ID" /></Form.Item>
          <Form.Item name="dueDate" label="截止日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
