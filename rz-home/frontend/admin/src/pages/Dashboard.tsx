import { useEffect, useState } from "react";
import { Alert, Card, Col, Progress, Row, Spin, Statistic, Typography, message } from "antd";
import { statsApi } from "../api";
import { errMsg } from "../api/client";
import type { StatsOverview } from "../types";

const { Title, Text } = Typography;

// 控制台：数据统计概览卡片 + 待处理留言 + 内容分布（GET /api/admin/stats/overview，P1）
export default function Dashboard() {
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

  const cards = [
    { title: "产品", value: stats.products.active, suffix: `/ ${stats.products.total}` },
    { title: "案例", value: stats.cases.active, suffix: `/ ${stats.cases.total}` },
    { title: "新闻(已发布)", value: stats.news.published, suffix: `/ ${stats.news.total}` },
    { title: "招聘(发布中)", value: stats.jobs.active, suffix: `/ ${stats.jobs.total}` },
    { title: "留言(待处理)", value: stats.messages.new, suffix: `/ ${stats.messages.total}` },
    { title: "轮播(启用)", value: stats.banners.active, suffix: `/ ${stats.banners.total}` },
    { title: "产品系列", value: stats.series },
    { title: "产品分类", value: stats.categories },
    { title: "里程碑", value: stats.milestones },
    { title: "管理员", value: stats.admins },
  ];

  const dist = [
    { label: "产品", total: stats.products.total, active: stats.products.active },
    { label: "案例", total: stats.cases.total, active: stats.cases.active },
    { label: "新闻", total: stats.news.total, active: stats.news.published },
    { label: "招聘", total: stats.jobs.total, active: stats.jobs.active },
    { label: "留言", total: stats.messages.total, active: stats.messages.handled },
    { label: "轮播", total: stats.banners.total, active: stats.banners.active },
  ];

  return (
    <div>
      <Title level={4} style={{ marginTop: 0, color: "#0E2A4A" }}>
        控制台
      </Title>
      {stats.messages.new > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`有 ${stats.messages.new} 条新留言待处理，请前往「留言管理」回复。`}
        />
      )}
      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col key={c.title} xs={12} sm={8} md={6} lg={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic title={c.title} value={c.value} suffix={c.suffix ?? ""} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="内容分布（启用/发布占比）" style={{ marginTop: 16, borderRadius: 8 }}>
        {dist.map((d) => (
          <div key={d.label} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <Text>
                {d.label}（{d.active}/{d.total}）
              </Text>
            </div>
            <Progress
              percent={d.total === 0 ? 0 : Math.round((d.active / d.total) * 100)}
              strokeColor="#00B3FF"
              trailColor="#E1F4FF"
            />
          </div>
        ))}
        <Text type="secondary" style={{ fontSize: 12 }}>
          近 7 日留言趋势需 v2 趋势接口（当前版本未提供），暂以总量与待处理数展示。
        </Text>
      </Card>
    </div>
  );
}
