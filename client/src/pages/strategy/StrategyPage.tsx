import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Table, Tag, Modal, Form, Input, Select, Progress, Space, Tabs, List, message, Popconfirm } from 'antd';
import { PlusOutlined, AimOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { strategyAPI } from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function StrategyPage() {
  const [brandGoals, setBrandGoals] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [monthlyReviews, setMonthlyReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [goalModal, setGoalModal] = useState({ open: false, record: null as any });
  const [channelModal, setChannelModal] = useState({ open: false, record: null as any });
  const [columnModal, setColumnModal] = useState({ open: false, record: null as any });
  const [strategyModal, setStrategyModal] = useState({ open: false, record: null as any });
  const [reviewModal, setReviewModal] = useState({ open: false, record: null as any });

  const [goalForm] = Form.useForm();
  const [channelForm] = Form.useForm();
  const [columnForm] = Form.useForm();
  const [strategyForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      strategyAPI.getBrandGoals(),
      strategyAPI.getChannels(),
      strategyAPI.getColumns(),
      strategyAPI.getStrategies(),
      strategyAPI.getMonthlyReviews(),
    ]).then(([goals, chs, cols, strs, mrs]) => {
      setBrandGoals(goals.data.data);
      setChannels(chs.data.data);
      setColumns(cols.data.data);
      setStrategies(strs.data.data);
      setMonthlyReviews(mrs.data.data.list);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveGoal = async (values: any) => {
    if (goalModal.record) {
      await strategyAPI.updateBrandGoal(goalModal.record.id, values);
      message.success('品牌目标更新成功');
    } else {
      await strategyAPI.createBrandGoal(values);
      message.success('品牌目标创建成功');
    }
    setGoalModal({ open: false, record: null });
    fetchData();
  };

  const handleDeleteGoal = async (id: string) => {
    await strategyAPI.deleteBrandGoal(id);
    message.success('已删除');
    fetchData();
  };

  const handleSaveChannel = async (values: any) => {
    if (channelModal.record) {
      await strategyAPI.updateChannel(channelModal.record.id, values);
      message.success('渠道更新成功');
    } else {
      await strategyAPI.createChannel(values);
      message.success('渠道创建成功');
    }
    setChannelModal({ open: false, record: null });
    fetchData();
  };

  const handleSaveColumn = async (values: any) => {
    if (columnModal.record) {
      await strategyAPI.updateColumn(columnModal.record.id, values);
      message.success('栏目更新成功');
    } else {
      await strategyAPI.createColumn(values);
      message.success('栏目创建成功');
    }
    setColumnModal({ open: false, record: null });
    fetchData();
  };

  const handleSaveStrategy = async (values: any) => {
    if (strategyModal.record) {
      await strategyAPI.updateStrategy(strategyModal.record.id, values);
      message.success('策略更新成功');
    } else {
      await strategyAPI.createStrategy(values);
      message.success('策略创建成功');
    }
    setStrategyModal({ open: false, record: null });
    fetchData();
  };

  const handleSaveReview = async (values: any) => {
    if (reviewModal.record) {
      await strategyAPI.updateMonthlyReview(reviewModal.record.id, values);
      message.success('复盘更新成功');
    } else {
      await strategyAPI.createMonthlyReview(values);
      message.success('复盘创建成功');
    }
    setReviewModal({ open: false, record: null });
    fetchData();
  };

  const platformNames: Record<string, string> = {
    weibo: '微博', wechat: '公众号', douyin: '抖音', xiaohongshu: '小红书', bilibili: 'B站', kuaishou: '快手',
  };

  const tabItems = [
    {
      key: 'goals', label: '🎯 品牌目标',
      children: (
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { goalForm.resetFields(); setGoalModal({ open: true, record: null }); }} style={{ marginBottom: 16 }}>
            新建目标
          </Button>
          <Row gutter={[16, 16]}>
            {brandGoals.map((g: any) => (
              <Col xs={24} md={12} key={g.id}>
                <Card
                  title={<Space><AimOutlined />{g.title}</Space>}
                  extra={
                    <Space>
                      <Button size="small" icon={<EditOutlined />} onClick={() => { goalForm.setFieldsValue(g); setGoalModal({ open: true, record: g }); }} />
                      <Popconfirm title="确定删除?" onConfirm={() => handleDeleteGoal(g.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                    </Space>
                  }
                >
                  <Text>{g.objective}</Text>
                  <Progress percent={g.progress} style={{ marginTop: 8 }} />
                  <Tag color={g.status === 'active' ? 'green' : 'default'}>{g.status === 'active' ? '进行中' : g.status}</Tag>
                  <Tag>{g.time_frame}</Tag>
                  {g.okr_key_results && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>关键结果：</Text>
                      {(() => { try { return JSON.parse(g.okr_key_results); } catch { return {}; } })().kr1 && (
                        <ul style={{ fontSize: 12, paddingLeft: 20, margin: '4px 0' }}>
                          {Object.values(JSON.parse(g.okr_key_results)).map((kr: any, i: number) => (
                            <li key={i}>{kr as string}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ),
    },
    {
      key: 'channels', label: '📡 渠道与栏目',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { channelForm.resetFields(); setChannelModal({ open: true, record: null }); }}>
              新建渠道
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => { columnForm.resetFields(); setColumnModal({ open: true, record: null }); }}>
              新建栏目
            </Button>
          </Space>
          <Table
            dataSource={channels}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '渠道名称', dataIndex: 'name', key: 'name' },
              { title: '平台', dataIndex: 'platform', key: 'platform', render: (v: string) => platformNames[v] || v },
              { title: '账号', dataIndex: 'account_name', key: 'account_name' },
              { title: '粉丝数', dataIndex: 'followers', key: 'followers', render: (v: number) => v?.toLocaleString() },
              { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '活跃' : '停用'}</Tag> },
              {
                title: '操作', key: 'action', render: (_: any, r: any) => (
                  <Button size="small" onClick={() => { channelForm.setFieldsValue(r); setChannelModal({ open: true, record: r }); }}>编辑</Button>
                ),
              },
            ]}
            expandable={{
              expandedRowRender: (channel: any) => (
                <Table
                  dataSource={columns.filter((c: any) => c.channel_id === channel.id)}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '栏目名', dataIndex: 'name' },
                    { title: '描述', dataIndex: 'description' },
                    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v === 'active' ? '活跃' : '已归档'}</Tag> },
                    { title: '排序', dataIndex: 'sort_order' },
                    {
                      title: '操作', render: (_: any, r: any) => (
                        <Button size="small" onClick={() => { columnForm.setFieldsValue(r); setColumnModal({ open: true, record: r }); }}>编辑</Button>
                      ),
                    },
                  ]}
                  style={{ margin: '-8px 0' }}
                />
              ),
            }}
          />
        </div>
      ),
    },
    {
      key: 'strategies', label: '📝 策略管理',
      children: (
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { strategyForm.resetFields(); setStrategyModal({ open: true, record: null }); }} style={{ marginBottom: 16 }}>
            新建策略
          </Button>
          <Table
            dataSource={strategies}
            rowKey="id"
            columns={[
              { title: '策略名称', dataIndex: 'name' },
              { title: '类型', dataIndex: 'type', render: (v: string) => {
                const m: Record<string, string> = { brand: '品牌', platform: '平台', content: '内容', growth: '增长' };
                return <Tag>{m[v] || v}</Tag>;
              }},
              { title: '关联目标', dataIndex: 'goal_title' },
              { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v === 'active' ? '启用' : v}</Tag> },
              { title: '内容', dataIndex: 'content', ellipsis: true },
              {
                title: '操作', render: (_: any, r: any) => (
                  <Button size="small" onClick={() => { strategyForm.setFieldsValue(r); setStrategyModal({ open: true, record: r }); }}>编辑</Button>
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'reviews', label: '🔄 月度复盘',
      children: (
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { reviewForm.resetFields(); setReviewModal({ open: true, record: null }); }} style={{ marginBottom: 16 }}>
            新建复盘
          </Button>
          <Table
            dataSource={monthlyReviews}
            rowKey="id"
            columns={[
              { title: '标题', dataIndex: 'title' },
              { title: '周期', dataIndex: 'period' },
              { title: '总结', dataIndex: 'summary', ellipsis: true },
              { title: '结论', dataIndex: 'conclusion', ellipsis: true },
              { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'completed' ? 'green' : 'default'}>{v === 'completed' ? '已完成' : v}</Tag> },
              { title: '创建人', dataIndex: 'creator_name' },
              {
                title: '操作', render: (_: any, r: any) => (
                  <Button size="small" onClick={() => { reviewForm.setFieldsValue(r); setReviewModal({ open: true, record: r }); }}>查看/编辑</Button>
                ),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>🎯 策略中心</Title>
      <Tabs items={tabItems} />

      {/* Brand Goal Modal */}
      <Modal title={goalModal.record ? '编辑品牌目标' : '新建品牌目标'} open={goalModal.open}
        onCancel={() => setGoalModal({ open: false, record: null })}
        onOk={() => goalForm.submit()} width={600}
      >
        <Form form={goalForm} layout="vertical" onFinish={handleSaveGoal}>
          <Form.Item name="title" label="目标标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="objective" label="目标描述"><TextArea rows={2} /></Form.Item>
          <Form.Item name="timeFrame" label="时间周期"><Input placeholder="如 2024-Q2" /></Form.Item>
          <Form.Item name="progress" label="进度 (%)"><Input type="number" min={0} max={100} /></Form.Item>
          <Form.Item name="status" label="状态"><Select options={[{ label: '进行中', value: 'active' }, { label: '已完成', value: 'completed' }, { label: '已归档', value: 'archived' }]} /></Form.Item>
        </Form>
      </Modal>

      {/* Channel Modal */}
      <Modal title={channelModal.record ? '编辑渠道' : '新建渠道'} open={channelModal.open}
        onCancel={() => setChannelModal({ open: false, record: null })}
        onOk={() => channelForm.submit()} width={500}
      >
        <Form form={channelForm} layout="vertical" onFinish={handleSaveChannel}>
          <Form.Item name="name" label="渠道名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="platform" label="平台" rules={[{ required: true }]}>
            <Select options={Object.entries(platformNames).map(([k, v]) => ({ label: v, value: k }))} />
          </Form.Item>
          <Form.Item name="accountName" label="账号名称"><Input /></Form.Item>
          <Form.Item name="accountId" label="账号ID"><Input /></Form.Item>
          <Form.Item name="followers" label="粉丝数"><Input type="number" /></Form.Item>
          <Form.Item name="description" label="描述"><TextArea rows={2} /></Form.Item>
          <Form.Item name="status" label="状态"><Select options={[{ label: '活跃', value: 'active' }, { label: '停用', value: 'inactive' }]} /></Form.Item>
        </Form>
      </Modal>

      {/* Column Modal */}
      <Modal title={columnModal.record ? '编辑栏目' : '新建栏目'} open={columnModal.open}
        onCancel={() => setColumnModal({ open: false, record: null })}
        onOk={() => columnForm.submit()} width={500}
      >
        <Form form={columnForm} layout="vertical" onFinish={handleSaveColumn}>
          <Form.Item name="name" label="栏目名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><TextArea rows={2} /></Form.Item>
          <Form.Item name="channelId" label="所属渠道">
            <Select options={channels.map((c: any) => ({ label: `${c.name} (${platformNames[c.platform] || c.platform})`, value: c.id }))} />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序"><Input type="number" /></Form.Item>
          <Form.Item name="status" label="状态"><Select options={[{ label: '活跃', value: 'active' }, { label: '已归档', value: 'archived' }]} /></Form.Item>
        </Form>
      </Modal>

      {/* Strategy Modal */}
      <Modal title={strategyModal.record ? '编辑策略' : '新建策略'} open={strategyModal.open}
        onCancel={() => setStrategyModal({ open: false, record: null })}
        onOk={() => strategyForm.submit()} width={600}
      >
        <Form form={strategyForm} layout="vertical" onFinish={handleSaveStrategy}>
          <Form.Item name="name" label="策略名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={[{ label: '品牌策略', value: 'brand' }, { label: '平台策略', value: 'platform' }, { label: '内容策略', value: 'content' }, { label: '增长策略', value: 'growth' }]} />
          </Form.Item>
          <Form.Item name="brandGoalId" label="关联品牌目标">
            <Select allowClear options={brandGoals.map((g: any) => ({ label: g.title, value: g.id }))} />
          </Form.Item>
          <Form.Item name="content" label="策略内容"><TextArea rows={4} /></Form.Item>
          <Form.Item name="status" label="状态"><Select options={[{ label: '草稿', value: 'draft' }, { label: '启用', value: 'active' }, { label: '已归档', value: 'archived' }]} /></Form.Item>
        </Form>
      </Modal>

      {/* Review Modal */}
      <Modal title={reviewModal.record ? '编辑复盘' : '新建复盘'} open={reviewModal.open}
        onCancel={() => setReviewModal({ open: false, record: null })}
        onOk={() => reviewForm.submit()} width={700}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleSaveReview}>
          <Form.Item name="title" label="复盘标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="period" label="周期" rules={[{ required: true }]}><Input placeholder="如 2024-05" /></Form.Item>
          <Form.Item name="summary" label="总结"><TextArea rows={2} /></Form.Item>
          <Form.Item name="content" label="详细内容"><TextArea rows={6} /></Form.Item>
          <Form.Item name="conclusion" label="结论"><TextArea rows={2} /></Form.Item>
          <Form.Item name="status" label="状态"><Select options={[{ label: '草稿', value: 'draft' }, { label: '已完成', value: 'completed' }, { label: '已分享', value: 'shared' }]} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
