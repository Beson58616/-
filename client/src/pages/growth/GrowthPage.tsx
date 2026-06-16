import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Statistic, Progress, Space, Spin } from 'antd';
import { RiseOutlined, DollarOutlined, PercentageOutlined, EyeOutlined } from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { dataAPI } from '../../services/api';

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const { Title, Text } = Typography;

const platformNames: Record<string, string> = {
  weibo: '微博', wechat: '公众号', douyin: '抖音', xiaohongshu: '小红书', bilibili: 'B站',
};

export default function GrowthPage() {
  const [conversions, setConversions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataAPI.getConversions().then(res => {
      setConversions(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 100 }} />;

  const totalVisits = conversions.reduce((s: number, c: any) => s + c.visit_count, 0);
  const totalConversions = conversions.reduce((s: number, c: any) => s + c.conversion_count, 0);
  const totalRevenue = conversions.reduce((s: number, c: any) => s + c.revenue, 0);
  const avgRate = totalVisits > 0 ? ((totalConversions / totalVisits) * 100).toFixed(2) : '0';

  // Funnel chart
  const funnelOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: conversions.map((c: any) => `${platformNames[c.platform] || c.platform}\n${c.name}`) },
    yAxis: { type: 'value' },
    series: [
      { name: '访问量', type: 'bar', data: conversions.map((c: any) => c.visit_count), itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] }, barGap: '10%' },
      { name: '转化量', type: 'bar', data: conversions.map((c: any) => c.conversion_count), itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] } },
    ],
  };

  // Revenue chart
  const revenueOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: conversions.map((c: any) => platformNames[c.platform] || c.platform) },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [{
      name: '收入', type: 'line', data: conversions.map((c: any) => c.revenue),
      smooth: true, symbol: 'circle', symbolSize: 10,
      itemStyle: { color: '#fa8c16' }, areaStyle: { color: 'rgba(250, 140, 22, 0.1)' },
    }],
  };

  return (
    <div>
      <Title level={4}>📈 增长转化中心</Title>

      {/* Overview Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card><Statistic title="总访问量" value={totalVisits} prefix={<EyeOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="总转化数" value={totalConversions} prefix={<RiseOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="平均转化率" value={`${avgRate}%`} prefix={<PercentageOutlined />} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="总收入" value={totalRevenue} prefix={<DollarOutlined />} precision={0} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="🔍 访问量与转化量对比">
            <ReactEChartsCore echarts={echarts} option={funnelOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="💰 各渠道收入">
            <ReactEChartsCore echarts={echarts} option={revenueOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      {/* Conversion Table */}
      <Card title="📊 转化明细">
        <Table
          dataSource={conversions}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '转化名称', dataIndex: 'name' },
            { title: '平台', dataIndex: 'platform', render: (v: string) => <Tag>{platformNames[v] || v}</Tag> },
            { title: '来源', dataIndex: 'source' },
            { title: '目标', dataIndex: 'target' },
            { title: '访问量', dataIndex: 'visit_count', render: (v: number) => v.toLocaleString() },
            { title: '转化量', dataIndex: 'conversion_count', render: (v: number) => v.toLocaleString() },
            { title: '转化率', dataIndex: 'rate', render: (v: number) => <Tag color={v >= 4 ? 'green' : v >= 2 ? 'blue' : 'orange'}>{v}%</Tag> },
            { title: '收入', dataIndex: 'revenue', render: (v: number) => `¥${v.toLocaleString()}` },
          ]}
        />
      </Card>
    </div>
  );
}
