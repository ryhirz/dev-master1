import { useState } from "react";
import { Layout, Menu, Button, Avatar, Dropdown } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ADMIN_NAV } from "../router";
import { useAdminStore } from "../store";

const { Sider, Header, Content } = Layout;

// 后台布局：左 Sider（Logo + 菜单树，按角色过滤）+ 顶栏（退出）+ 内容区 max-w-[1440px]
export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = useAdminStore((s) => s.role);
  const logout = useAdminStore((s) => s.logout);

  const items = ADMIN_NAV.filter((i) => !i.roles || i.roles.includes(role)).map((i) => ({
    key: i.path,
    label: i.label,
  }));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light">
        <div
          style={{
            height: 48,
            margin: 16,
            color: "#6B4F3A",
            fontWeight: 700,
            fontSize: collapsed ? 14 : 18,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          Rz家居 后台
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #E5DDD2",
          }}
        >
          <span style={{ color: "#8A7E72" }}>后台管理系统</span>
          <Dropdown
            menu={{
              items: [
                { key: "logout", icon: <LogoutOutlined />, label: "退出登录", onClick: handleLogout },
              ],
            }}
          >
            <span style={{ cursor: "pointer" }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: "#6B4F3A" }} />
              <span style={{ marginLeft: 8 }}>管理员</span>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, maxWidth: 1440 }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 24, minHeight: 360 }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
