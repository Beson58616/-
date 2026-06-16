import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Button, Modal, Form, Input, Select, Space, List, message } from 'antd';
import { PlusOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { collabAPI } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const reviewTypeLabels: Record<string, string> = {
  content: '内容复盘', campaign: '活动复盘', monthly: '月度复盘', quarterly: '季度复盘', platform: '平台复盘',
};

const statusLabels: Record<string, string> = {
  draft: '草稿', completed: '已完成', shared: '已分享',
};

export default function ReviewPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, record: null as any });
  const [viewModal, setViewModal] = useState({ open: false, review: null as any });
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    collabAPI.getReviews({ pageSize: '100' }).then(res => {
      setReviews(res.data.data.list);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values: any) => {
    if (modal.record) {
      await collabAPI.updateReview(modal.record.id, values);
      message.success('复盘更新成功');
    } else {
      await collabAPI.createReview(values);
      message.success('复盘创建成功');
    }
    setModal({ open: false, record: null });
    fetchData();
  };

  return (
    <div>
      <Title level={4}>🔄 复盘中心</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModal({ open: true, record: null }); }}>
              新建复盘
            </Button>
          </div>
          <Table
            dataSource={reviews}
            rowKey="id"
            loading={loading}
            columns={[
              { title: '复盘标题', dataIndex: 'title', ellipsis: true },
              { title: '类型', dataIndex: 'review_type', width: 100, render: (v: string) => <Tag>{reviewTypeLabels[v] || v}</Tag> },
              { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'completed' ? 'green' : v === 'shared' ? 'blue' : 'default'}>{statusLabels[v] || v}</Tag> },
              { title: '总结', dataIndex: 'summary', ellipsis: true, width: 200 },
              { title: '创建人', dataIndex: 'creator_name', width: 100 },
              { title: '更新时间', dataIndex: 'updated_at', width: 120, render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
              {
                title: '操作', width: 160, render: (_: any, r: any) => (
                  <Space>
                    <Button size="small" onClick={() => setViewModal({ open: true, review: r })}>查看</Button>
                    <Button size="small" icon={<EditOutlined />} onClick={() => { form.setFieldsValue(r); setModal({ open: true, record: r }); }}>编辑</Button>
                  </Space>
                ),
              },
            ]}
          />
        </Col>
        <Col xs={24} lg={8}>
          <Card title="📈 复盘统计" size="small">
            <List
              dataSource={[
                { label: '内容复盘', value: reviews.filter(r => r.review_type === 'content').length },
                { label: '活动复盘', value: reviews.filter(r => r.review_type === 'campaign').length },
                { label: '月度复盘', value: reviews.filter(r => r.review_type === 'monthly').length },
                { label: '已完成', value: reviews.filter(r => r.status === 'completed').length },
                { label: '草稿', value: reviews.filter(r => r.status === 'draft').length },
              ]}
              renderItem={(item: any) => (
                <List.Item>
                  <Text>{item.label}</Text>
                  <Tag color="blue">{item.value}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Create/Edit Modal */}
      <Modal title={modal.record ? '编辑复盘' : '新建复盘'} open={modal.open}
        onCancel={() => setModal({ open: false, record: null })} onOk={() => form.submit()} width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="title" label="复盘标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="reviewType" label="类型" rules={[{ required: true }]}>
            <Select options={Object.entries(reviewTypeLabels).map(([k, v]) => ({ label: v, value: k }))} />
          </Form.Item>
          <Form.Item name="summary" label="总结"><TextArea rows={2} /></Form.Item>
          <Form.Item name="conclusion" label="结论"><TextArea rows={3} placeholder="复盘结论和发现..."/></Form.Item>
          <Form.Item name="status" label="状态"><Select options={[{ label: '草稿', value: 'draft' }, { label: '已完成', value: 'completed' }, { label: '已分享', value: 'shared' }]} /></Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal title={viewModal.review?.title} open={viewModal.open}
        onCancel={() => setViewModal({ open: false, review: null })}
        footer={null} width={700}
      >
        {viewModal.review && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color="blue">{reviewTypeLabels[viewModal.review.review_type]}</Tag>
              <Tag color={viewModal.review.status === 'completed' ? 'green' : 'default'}>{statusLabels[viewModal.review.status]}</Tag>
              <Text type="secondary">{viewModal.review.creator_name} · {viewModal.review.updated_at ? dayjs(viewModal.review.updated_at).format('YYYY-MM-DD HH:mm') : ''}</Text>
            </Space>
            <Card title="总结" size="small" style={{ marginBottom: 12 }}>
              <Text>{viewModal.review.summary || '(无)'}</Text>
            </Card>
            <Card title="结论" size="small" style={{ marginBottom: 12 }}>
              <Text>{viewModal.review.conclusion || '(无)'}</Text>
            </Card>
            {viewModal.review.action_items && (() => {
              try {
                const items = JSON.parse(viewModal.review.action_items);
                if (Array.isArray(items) && items.length > 0) {
                  return (
                    <Card title="行动项" size="small">
                      <ul>{items.map((item: string, i: number) => <li key={i}><Text>{item}</Text></li>)}</ul>
                    </Card>
                  );
                }
              } catch { return null; }
              return null;
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
