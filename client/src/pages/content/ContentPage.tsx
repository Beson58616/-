import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Table, Tag, Modal, Form, Input, Select, DatePicker, Space, Tabs, List, message, Popconfirm, Badge, Calendar, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, CalendarOutlined, FileTextOutlined, PictureOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { contentAPI, strategyAPI } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const platformNames: Record<string, string> = {
  weibo: '微博', wechat: '公众号', douyin: '抖音', kuaishou: '快手', xiaohongshu: '小红书', bilibili: 'B站', other: '其他',
};

const statusColors: Record<string, string> = {
  draft: 'default', submitted: 'orange', approved: 'blue', in_progress: 'processing', completed: 'green', rejected: 'red', archived: 'default',
  planned: 'blue', published: 'green', failed: 'red', cancelled: 'default',
  review: 'orange',
};

const statusLabels: Record<string, string> = {
  draft: '草稿', submitted: '已提交', approved: '已通过', in_progress: '进行中', completed: '已完成', rejected: '已拒绝', archived: '已归档',
  planned: '计划中', published: '已发布', failed: '发布失败', cancelled: '已取消',
  review: '审核中',
};

export default function ContentPage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [topicModal, setTopicModal] = useState({ open: false, record: null as any });
  const [scriptModal, setScriptModal] = useState({ open: false, record: null as any });
  const [assetModal, setAssetModal] = useState({ open: false, record: null as any });
  const [planModal, setPlanModal] = useState({ open: false, record: null as any });
  const [scriptViewModal, setScriptViewModal] = useState({ open: false, script: null as any });

  const [topicForm] = Form.useForm();
  const [scriptForm] = Form.useForm();
  const [assetForm] = Form.useForm();
  const [planForm] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      contentAPI.getTopics({ pageSize: '100' }),
      contentAPI.getScripts({ pageSize: '100' }),
      contentAPI.getAssets({ pageSize: '100' }),
      contentAPI.getPlans({ pageSize: '100' }),
    ]).then(([t, s, a, p]) => {
      setTopics(t.data.data.list);
      setScripts(s.data.data.list);
      setAssets(a.data.data.list);
      setPlans(p.data.data.list);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveTopic = async (values: any) => {
    if (topicModal.record) {
      await contentAPI.updateTopic(topicModal.record.id, values);
      message.success('选题更新成功');
    } else {
      await contentAPI.createTopic(values);
      message.success('选题创建成功');
    }
    setTopicModal({ open: false, record: null });
    fetchData();
  };

  const handleDeleteTopic = async (id: string) => {
    await contentAPI.deleteTopic(id);
    message.success('已删除');
    fetchData();
  };

  const handleSaveScript = async (values: any) => {
    if (scriptModal.record) {
      await contentAPI.updateScript(scriptModal.record.id, values);
      message.success('脚本更新成功');
    } else {
      await contentAPI.createScript(values);
      message.success('脚本创建成功');
    }
    setScriptModal({ open: false, record: null });
    fetchData();
  };

  const handleDeleteScript = async (id: string) => {
    await contentAPI.deleteScript(id);
    message.success('已删除');
    fetchData();
  };

  const handleSaveAsset = async (values: any) => {
    if (assetModal.record) {
      await contentAPI.updateAsset(assetModal.record.id, values);
      message.success('素材更新成功');
    } else {
      await contentAPI.createAsset(values);
      message.success('素材创建成功');
    }
    setAssetModal({ open: false, record: null });
    fetchData();
  };

  const handleDeleteAsset = async (id: string) => {
    await contentAPI.deleteAsset(id);
    message.success('已删除');
    fetchData();
  };

  const handleSavePlan = async (values: any) => {
    const data = { ...values, scheduledAt: values.scheduledAt ? values.scheduledAt.format('YYYY-MM-DD HH:mm:ss') : '' };
    if (planModal.record) {
      await contentAPI.updatePlan(planModal.record.id, data);
      message.success('排期更新成功');
    } else {
      await contentAPI.createPlan(data);
      message.success('排期创建成功');
    }
    setPlanModal({ open: false, record: null });
    fetchData();
  };

  const handleDeletePlan = async (id: string) => {
    await contentAPI.deletePlan(id);
    message.success('已删除');
    fetchData();
  };

  const handlePublish = async (id: string) => {
    await contentAPI.publishPlan(id);
    message.success('发布成功！');
    fetchData();
  };

  const priorityColors: Record<string, string> = { low: 'default', medium: 'blue', high: 'orange', urgent: 'red' };
  const priorityLabels: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' };

  // Calendar data for plans
  const getCalendarData = () => {
    const data: Record<string, any[]> = {};
    plans.forEach((p: any) => {
      if (p.scheduled_at) {
        const date = p.scheduled_at.split(' ')[0] || p.scheduled_at.split('T')[0];
        if (!data[date]) data[date] = [];
        data[date].push(p);
      }
    });
    return data;
  };

  const calendarData = getCalendarData();

  const tabItems = [
    {
      key: 'topics', label: '💡 选题管理',
      children: (
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { topicForm.resetFields(); setTopicModal({ open: true, record: null }); }} style={{ marginBottom: 16 }}>
            新建选题
          </Button>
          <Table
            dataSource={topics}
            rowKey="id"
            loading={loading}
            columns={[
              { title: '选题标题', dataIndex: 'title', ellipsis: true, width: 200 },
              { title: '状态', dataIndex: 'status', width: 100, render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag> },
              { title: '优先级', dataIndex: 'priority', width: 80, render: (v: string) => <Tag color={priorityColors[v]}>{priorityLabels[v]}</Tag> },
              { title: '负责人', dataIndex: 'assignee_name', width: 100 },
              { title: '创建者', dataIndex: 'creator_name', width: 100 },
              { title: '标签', dataIndex: 'tags', width: 150, ellipsis: true },
              { title: '更新时间', dataIndex: 'updated_at', width: 120, render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
              {
                title: '操作', width: 200, render: (_: any, r: any) => (
                  <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => { topicForm.setFieldsValue(r); setTopicModal({ open: true, record: r }); }}>编辑</Button>
                    <Button size="small" icon={<FileTextOutlined />} onClick={() => {
                      scriptForm.resetFields();
                      scriptForm.setFieldsValue({ topicId: r.id, title: `[${r.title}] 脚本` });
                      setScriptModal({ open: true, record: null });
                    }}>写脚本</Button>
                    <Popconfirm title="确定删除?" onConfirm={() => handleDeleteTopic(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'scripts', label: '📝 脚本库',
      children: (
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { scriptForm.resetFields(); setScriptModal({ open: true, record: null }); }} style={{ marginBottom: 16 }}>
            新建脚本
          </Button>
          <Table
            dataSource={scripts}
            rowKey="id"
            loading={loading}
            columns={[
              { title: '脚本标题', dataIndex: 'title', ellipsis: true, width: 200 },
              { title: '关联选题', dataIndex: 'topic_title', width: 150, ellipsis: true },
              { title: '版本', dataIndex: 'version', width: 60, render: (v: number) => `v${v}` },
              { title: '状态', dataIndex: 'status', width: 100, render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag> },
              { title: '作者', dataIndex: 'author_name', width: 100 },
              { title: '更新时间', dataIndex: 'updated_at', width: 120, render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
              {
                title: '操作', width: 200, render: (_: any, r: any) => (
                  <Space>
                    <Button size="small" onClick={() => setScriptViewModal({ open: true, script: r })}>查看</Button>
                    <Button size="small" icon={<EditOutlined />} onClick={() => { scriptForm.setFieldsValue(r); setScriptModal({ open: true, record: r }); }}>编辑</Button>
                    <Popconfirm title="确定删除?" onConfirm={() => handleDeleteScript(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'assets', label: '🖼️ 素材库',
      children: (
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { assetForm.resetFields(); setAssetModal({ open: true, record: null }); }} style={{ marginBottom: 16 }}>
            上传素材
          </Button>
          <Row gutter={[16, 16]}>
            {assets.map((a: any) => (
              <Col xs={24} sm={12} md={8} lg={6} key={a.id}>
                <Card
                  hoverable
                  cover={
                    a.type === 'image' ? (
                      <div style={{ height: 140, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PictureOutlined style={{ fontSize: 48, color: '#ccc' }} />
                      </div>
                    ) : a.type === 'video' ? (
                      <div style={{ height: 140, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <VideoCameraOutlined style={{ fontSize: 48, color: '#ccc' }} />
                      </div>
                    ) : (
                      <div style={{ height: 140, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileTextOutlined style={{ fontSize: 48, color: '#ccc' }} />
                      </div>
                    )
                  }
                  actions={[
                    <EditOutlined key="edit" onClick={() => { assetForm.setFieldsValue(a); setAssetModal({ open: true, record: a }); }} />,
                    <Popconfirm key="del" title="确定删除?" onConfirm={() => handleDeleteAsset(a.id)}><DeleteOutlined /></Popconfirm>,
                  ]}
                >
                  <Card.Meta title={a.name} description={
                    <div>
                      <Tag color="blue">{a.type}</Tag>
                      {a.tags?.split(',').filter(Boolean).map((t: string) => <Tag key={t}>{t.trim()}</Tag>)}
                    </div>
                  } />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ),
    },
    {
      key: 'plans', label: '📅 内容排期',
      children: (
        <Row gutter={16}>
          <Col xs={24} lg={8}>
            <Card title="发布日历" size="small">
              <Calendar
                fullscreen={false}
                cellRender={(date) => {
                  const dateStr = date.format('YYYY-MM-DD');
                  const dayPlans = calendarData[dateStr] || [];
                  if (dayPlans.length === 0) return null;
                  return (
                    <Tooltip title={dayPlans.map((p: any) => p.title).join(', ')}>
                      <Badge status="processing" text={`${dayPlans.length}条`} />
                    </Tooltip>
                  );
                }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={16}>
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { planForm.resetFields(); setPlanModal({ open: true, record: null }); }}>
                新建排期
              </Button>
            </div>
            <Table
              dataSource={plans}
              rowKey="id"
              loading={loading}
              columns={[
                { title: '标题', dataIndex: 'title', ellipsis: true, width: 180 },
                { title: '选题', dataIndex: 'topic_title', width: 120, ellipsis: true },
                { title: '平台', dataIndex: 'platform', width: 80, render: (v: string) => <Tag>{platformNames[v] || v}</Tag> },
                { title: '计划时间', dataIndex: 'scheduled_at', width: 130, render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
                { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag> },
                {
                  title: '操作', width: 180, render: (_: any, r: any) => (
                    <Space>
                      {r.status === 'planned' && (
                        <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handlePublish(r.id)}>发布</Button>
                      )}
                      <Button size="small" icon={<EditOutlined />} onClick={() => {
                        planForm.setFieldsValue({ ...r, scheduledAt: r.scheduled_at ? dayjs(r.scheduled_at) : undefined });
                        setPlanModal({ open: true, record: r });
                      }}>编辑</Button>
                      <Popconfirm title="确定删除?" onConfirm={() => handleDeletePlan(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>📝 内容中心</Title>
      <Tabs items={tabItems} />

      {/* Topic Modal */}
      <Modal title={topicModal.record ? '编辑选题' : '新建选题'} open={topicModal.open}
        onCancel={() => setTopicModal({ open: false, record: null })} onOk={() => topicForm.submit()} width={600}
      >
        <Form form={topicForm} layout="vertical" onFinish={handleSaveTopic}>
          <Form.Item name="title" label="选题标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><TextArea rows={3} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="priority" label="优先级"><Select options={Object.entries(priorityLabels).map(([k, v]) => ({ label: v, value: k }))} /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="状态"><Select options={Object.entries(statusLabels).filter(([k]) => ['draft','submitted','approved','in_progress','completed','rejected','archived'].includes(k)).map(([k, v]) => ({ label: v, value: k }))} /></Form.Item></Col>
          </Row>
          <Form.Item name="assignedTo" label="负责人"><Input /></Form.Item>
          <Form.Item name="tags" label="标签"><Input placeholder="逗号分隔" /></Form.Item>
        </Form>
      </Modal>

      {/* Script Modal */}
      <Modal title={scriptModal.record ? '编辑脚本' : '新建脚本'} open={scriptModal.open}
        onCancel={() => setScriptModal({ open: false, record: null })} onOk={() => scriptForm.submit()} width={700}
      >
        <Form form={scriptForm} layout="vertical" onFinish={handleSaveScript}>
          <Form.Item name="title" label="脚本标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="topicId" label="关联选题">
            <Select allowClear placeholder="选择关联选题" options={topics.map((t: any) => ({ label: t.title, value: t.id }))} />
          </Form.Item>
          <Form.Item name="content" label="脚本内容"><TextArea rows={10} placeholder="编写你的脚本内容..." /></Form.Item>
          <Form.Item name="status" label="状态"><Select options={[{ label: '草稿', value: 'draft' }, { label: '审核中', value: 'review' }, { label: '已通过', value: 'approved' }, { label: '已发布', value: 'published' }]} /></Form.Item>
        </Form>
      </Modal>

      {/* Script View Modal */}
      <Modal title={scriptViewModal.script?.title || '查看脚本'} open={scriptViewModal.open}
        onCancel={() => setScriptViewModal({ open: false, script: null })}
        footer={null} width={700}
      >
        <div style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: 16, borderRadius: 8, maxHeight: 500, overflow: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
          {scriptViewModal.script?.content || '(无内容)'}
        </div>
        {scriptViewModal.script && (
          <div style={{ marginTop: 16 }}>
            <Space>
              <Tag>版本 v{scriptViewModal.script.version}</Tag>
              <Tag color={statusColors[scriptViewModal.script.status]}>{statusLabels[scriptViewModal.script.status]}</Tag>
              <Text type="secondary">作者：{scriptViewModal.script.author_name}</Text>
            </Space>
          </div>
        )}
      </Modal>

      {/* Asset Modal */}
      <Modal title={assetModal.record ? '编辑素材' : '上传素材'} open={assetModal.open}
        onCancel={() => setAssetModal({ open: false, record: null })} onOk={() => assetForm.submit()} width={500}
      >
        <Form form={assetForm} layout="vertical" onFinish={handleSaveAsset}>
          <Form.Item name="name" label="素材名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={[{ label: '图片', value: 'image' }, { label: '视频', value: 'video' }, { label: '文档', value: 'document' }, { label: '音频', value: 'audio' }, { label: '其他', value: 'other' }]} />
          </Form.Item>
          <Form.Item name="url" label="URL"><Input placeholder="素材地址" /></Form.Item>
          <Form.Item name="tags" label="标签"><Input placeholder="逗号分隔" /></Form.Item>
        </Form>
      </Modal>

      {/* Plan Modal */}
      <Modal title={planModal.record ? '编辑排期' : '新建排期'} open={planModal.open}
        onCancel={() => setPlanModal({ open: false, record: null })} onOk={() => planForm.submit()} width={600}
      >
        <Form form={planForm} layout="vertical" onFinish={handleSavePlan}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="topicId" label="关联选题">
                <Select allowClear options={topics.map((t: any) => ({ label: t.title, value: t.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scriptId" label="关联脚本">
                <Select allowClear options={scripts.map((s: any) => ({ label: s.title, value: s.id }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="platform" label="发布平台" rules={[{ required: true }]}>
                <Select options={Object.entries(platformNames).map(([k, v]) => ({ label: v, value: k }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scheduledAt" label="计划发布时间">
                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
