import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, List, Typography, Progress, Space, Spin } from 'antd';
import {
  FileTextOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined,
  WarningOutlined, RiseOutlined,
} from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { dataAPI } from '../../services/api';
import dayjs from 'dayjs';

echarts.use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

const { Title, Text } = Typography;

const platformColors: Record<string, string> = {
  weibo: '#e6162d', wechat: '#07c160', douyin: '#010101',
  xiaohongshu: '#fe2c55', bilibili: '#00a1d6',
};

const platformNames: Record<string, string> = {
  weibo: '微博', wechat: '公众号', douyin: '抖音', xiaohongshu: '小红书', bilibili: 'B站',
};

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataAPI.getDashboardOverview().then(res => {
      setData(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 100 }} />;
  if (!data) return <Text type="secondary">加载失败，请刷新重试</Text>;

  const { stats, platformMetrics, conversionSummary, brandGoals, todayPlans, recentTasks } = data;

  // Platform comparison chart
  const barOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['曝光量', '互动量', '分享量'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: platformMetrics.map((m: any) => platformNames[m.platform] || m.platform) },
    yAxis: { type: 'value' },
    series: [
      { name: '曝光量', type: 'bar', data: platformMetrics.map((m: any) => m.impressions), itemStyle: { color: '#1677ff' } },
      { name: '互动量', type: 'bar', data: platformMetrics.map((m: any) => m.engagements), itemStyle: { color: '#52c41a' } },
      { name: '分享量', type: 'bar', data: platformMetrics.map((m: any) => m.shares), itemStyle: { color: '#fa8c16' } },
    ],
  };

  // Conversion pie chart
  const pieOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['40%', '50%'],
      data: conversionSummary.map((c: any) => ({
        name: platformNames[c.platform] || c.platform,
        value: c.conversions,
        itemStyle: { color: platformColors[c.platform] || '#1677ff' },
      })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    }],
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>📊 首页总览 · 30 秒快速看板</Title>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="选题总数" value={stats.totalTopics} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="进行中选题" value={stats.activeTopics} prefix={<EditOutlined />} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="脚本总数" value={stats.totalScripts} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="待处理审批" value={stats.pendingApprovals} prefix={<WarningOutlined />} valueStyle={{ color: stats.pendingApprovals > 0 ? '#ff4d4f' : '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="待办任务" value={stats.pendingTasks} prefix={<ClockCircleOutlined />} valueStyle={{ color: stats.pendingTasks > 0 ? '#fa8c16' : '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="已发布脚本" value={stats.publishedScripts} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="📈 各平台7日数据对比">
            <ReactEChartsCore echarts={echarts} option={barOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="🔄 转化分布">
            <ReactEChartsCore echarts={echarts} option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Brand Goals */}
        <Col xs={24} lg={8}>
          <Card title="🎯 品牌目标进度" style={{ marginBottom: 16 }}>
            {brandGoals.map((g: any) => (
              <div key={g.id} style={{ marginBottom: 16 }}>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text strong>{g.title}</Text>
                  <Text type="secondary">{g.progress}%</Text>
                </Space>
                <Progress percent={g.progress} size="small" status={g.progress >= 80 ? 'success' : 'active'} />
              </div>
            ))}
          </Card>
        </Col>

        {/* Today Plans */}
        <Col xs={24} lg={8}>
          <Card title="📅 今日发布计划" style={{ marginBottom: 16 }}>
            {todayPlans.length === 0 ? (
              <Text type="secondary">今日无发布计划</Text>
            ) : (
              <List dataSource={todayPlans} renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={`${platformNames[item.platform] || item.platform} · ${item.scheduled_at ? dayjs(item.scheduled_at).format('HH:mm') : '待定'}`}
                  />
                  <Tag color={item.status === 'published' ? 'green' : 'blue'}>
                    {item.status === 'published' ? '已发布' : '待发布'}
                  </Tag>
                </List.Item>
              )} />
            )}
          </Card>
        </Col>

        {/* Recent Tasks */}
        <Col xs={24} lg={8}>
          <Card title="📋 近期任务" style={{ marginBottom: 16 }}>
            <List dataSource={recentTasks.slice(0, 5)} renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  title={item.title}
                  description={`${item.assignee_name || '未分配'} · ${item.due_date || '无截止日期'}`}
                />
                <Tag color={
                  item.status === 'done' ? 'green' :
                  item.status === 'in_progress' ? 'blue' :
                  item.status === 'urgent' ? 'red' : 'default'
                }>
                  {item.status === 'done' ? '已完成' : item.status === 'in_progress' ? '进行中' : item.status === 'todo' ? '待办' : item.status}
                </Tag>
              </List.Item>
            )} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
