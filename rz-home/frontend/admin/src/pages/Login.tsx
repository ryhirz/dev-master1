import { useState } from "react";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useAdminStore } from "../store";
import { errMsg } from "../api/client";

const { Title, Text } = Typography;

// 登录页：账号/密码 → POST /api/admin/login → 写 token → 按角色跳控制台（或来源页）
export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAdminStore((s) => s.login);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const me = await login(values.username, values.password);
      message.success(`欢迎回来，${me.display_name || me.username}`);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== "/login" ? from : "/dashboard", { replace: true });
    } catch (e) {
      message.error(errMsg(e, "登录失败"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #FAF7F2 0%, #F1E9E0 100%)",
      }}
    >
      <Card style={{ width: 380, borderRadius: 12, boxShadow: "0 4px 24px rgba(107,79,58,.12)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "inline-flex",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#6B4F3A",
              color: "#fff",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            R
          </div>
          <Title level={4} style={{ marginBottom: 4, color: "#1F1B16" }}>
            Rz家居 后台管理系统
          </Title>
          <Text type="secondary">企业官网内容运营后台</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="username" label="管理员账号" rules={[{ required: true, message: "请输入账号" }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入管理员账号" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>
        <Text type="secondary" style={{ fontSize: 12 }}>
          默认账号 admin / admin123（首次部署后请修改）
        </Text>
      </Card>
    </div>
  );
}
