import { useEffect, useState } from "react";
import { Card, Col, Progress, Row, Spin, Statistic, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { statsApi } from "../api";
import { errMsg } from "../api/client";
import type { StatsOverview } from "../types";

const { Title, Text } = Typography;

// 数据统计：内容量分布 + 明细表（GET /api/admin/stats/overview，P1）
export default function Stats() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi
      .overview()
      .then(setStats)
      .catch((e) => message.error(errMsg(e, "统计加载失败")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!stats) return null;

  const rows = [
    { module: "产品", total: stats.products.total, active: stats.products.active, unit: "active/total" },
    { module: "案例", total: stats.cases.total, active: stats.cases.active, unit: "active/total" },
    { module: "新闻", total: stats.news.total, active: stats.news.published, unit: "published/total" },
    { module: "招聘", total: stats.jobs.total, active: stats.jobs.active, unit: "active/total" },
    { module: "留言", total: stats.messages.total, active: stats.messages.handled, unit: "handled/total" },
    { module: "轮播", total: stats.banners.total, active: stats.banners.active, unit: "active/total" },
    { module: "产品系列", total: stats.series, active: stats.series, unit: "—" },
    { module: "产品分类", total: stats.categories, active: stats.categories, unit: "—" },
    { module: "里程碑", total: stats.milestones, active: stats.milestones, unit: "—" },
    { module: "管理员", total: stats.admins, active: stats.admins, unit: "—" },
  ];

  const columns: ColumnsType<(typeof rows)[number]> = [
    { title: "模块", dataIndex: "module" },
    { title: "总量", dataIndex: "total", width: 100 },
    { title: "启用/发布", dataIndex: "active", width: 100 },
    { title: "口径", dataIndex: "unit", width: 120 },
    {
      title: "占比",
      width: 240,
      render: (_, r) => (
        <Progress
          percent={r.total === 0 ? 0 : Math.round((r.active / r.total) * 100)}
          strokeColor="#00B3FF"
          trailColor="#E1F4FF"
          size="small"
        />
      ),
    },
  ];

  const headCards = [
    { title: "内容总量", value: stats.products.total + stats.cases.total + stats.news.total + stats.jobs.total + stats.banners.total },
    { title: "留言总数", value: stats.messages.total },
    { title: "待处理留言", value: stats.messages.new },
    { title: "已处理留言", value: stats.messages.handled },
  ];

  return (
    <div>
      <Title level={4} style={{ marginTop: 0, color: "#0E2A4A" }}>
        数据统计
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {headCards.map((c) => (
          <Col key={c.title} xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic title={c.title} value={c.value} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="内容量分布明细" style={{ borderRadius: 8 }}>
        <Table
          rowKey="module"
          columns={columns}
          dataSource={rows}
          pagination={false}
          size="middle"
        />
        <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
          新闻按已发布数计占比；留言按已处理数计占比。趋势类图表需 v2 统计接口（当前版本未提供）。
        </Text>
      </Card>
    </div>
  );
}
