import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Statistic, Space, Spin } from 'antd';
import { TeamOutlined, EyeOutlined, LikeOutlined, ShareAltOutlined } from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { strategyAPI, dataAPI, contentAPI } from '../../services/api';
import dayjs from 'dayjs';

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const { Title, Text } = Typography;

const platformColors: Record<string, string> = {
  weibo: '#e6162d', wechat: '#07c160', douyin: '#010101',
  xiaohongshu: '#fe2c55', bilibili: '#00a1d6', kuaishou: '#ff4906',
};

const platformNames: Record<string, string> = {
  weibo: '微博', wechat: '公众号', douyin: '抖音', xiaohongshu: '小红书', bilibili: 'B站', kuaishou: '快手',
};

export default function ChannelPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      strategyAPI.getChannels(),
      dataAPI.getMetrics(),
      contentAPI.getPlans({ pageSize: '100' }),
    ]).then(([ch, mt, pl]) => {
      setChannels(ch.data.data);
      setMetrics(mt.data.data);
      setPlans(pl.data.data.list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 100 }} />;

  // Aggregate metrics by platform
  const platformStats = channels.map((ch: any) => {
    const channelMetrics = metrics.filter((m: any) => m.platform === ch.platform);
    const impressions = channelMetrics.filter((m: any) => m.metric_key === 'impression').reduce((sum: number, m: any) => sum + m.value, 0);
    const engagements = channelMetrics.filter((m: any) => m.metric_key === 'engagement').reduce((sum: number, m: any) => sum + m.value, 0);
    const shares = channelMetrics.filter((m: any) => m.metric_key === 'share').reduce((sum: number, m: any) => sum + m.value, 0);
    const channelPlans = plans.filter((p: any) => p.platform === ch.platform);
    const publishedCount = channelPlans.filter((p: any) => p.status === 'published').length;
    return { ...ch, impressions, engagements, shares, totalPlans: channelPlans.length, publishedCount };
  });

  // Bar chart option
  const barOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['曝光量(万)', '互动量(万)'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: platformStats.map((s: any) => s.name) },
    yAxis: { type: 'value' },
    series: [
      { name: '曝光量(万)', type: 'bar', data: platformStats.map((s: any) => +(s.impressions / 10000).toFixed(1)), itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] } },
      { name: '互动量(万)', type: 'bar', data: platformStats.map((s: any) => +(s.engagements / 10000).toFixed(1)), itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] } },
    ],
  };

  return (
    <div>
      <Title level={4}>📡 渠道中心</Title>

      {/* Channel Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {platformStats.map((ch: any) => (
          <Col xs={24} sm={12} lg={8} key={ch.id}>
            <Card
              title={<Space><Tag color={platformColors[ch.platform]}>{platformNames[ch.platform] || ch.platform}</Tag>{ch.name}</Space>}
              style={{ borderTop: `3px solid ${platformColors[ch.platform] || '#1677ff'}` }}
            >
              <Row gutter={16}>
                <Col span={12}><Statistic title="粉丝" value={ch.followers} prefix={<TeamOutlined />} /></Col>
                <Col span={12}><Statistic title="内容数" value={ch.totalPlans} suffix={`/ ${ch.publishedCount} 已发布`} /></Col>
              </Row>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">账号：{ch.account_name || '未配置'}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>{ch.description || '暂无描述'}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="📊 各渠道内容表现对比">
            <ReactEChartsCore echarts={echarts} option={barOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      {/* Detailed Metrics Table */}
      <Card title="📋 渠道内容指标明细">
        <Table
          dataSource={platformStats}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '渠道', dataIndex: 'name', key: 'name' },
            { title: '平台', dataIndex: 'platform', key: 'platform', render: (v: string) => <Tag color={platformColors[v]}>{platformNames[v] || v}</Tag> },
            { title: '粉丝数', dataIndex: 'followers', key: 'followers', render: (v: number) => v.toLocaleString() },
            { title: '曝光量', dataIndex: 'impressions', key: 'impressions', render: (v: number) => v.toLocaleString() },
            { title: '互动量', dataIndex: 'engagements', key: 'engagements', render: (v: number) => v.toLocaleString() },
            { title: '分享量', dataIndex: 'shares', key: 'shares', render: (v: number) => v.toLocaleString() },
            { title: '互动率', key: 'rate', render: (_: any, r: any) => r.impressions > 0 ? `${((r.engagements / r.impressions) * 100).toFixed(2)}%` : '-' },
            { title: '发布数', key: 'publish', render: (_: any, r: any) => `${r.publishedCount} / ${r.totalPlans}` },
          ]}
        />
      </Card>
    </div>
  );
}
