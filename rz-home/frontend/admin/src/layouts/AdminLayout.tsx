import { useState } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, Tag } from "antd";
import { LogoutOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ADMIN_NAV } from "../router";
import { useAdminStore } from "../store";

const { Sider, Header, Content } = Layout;

const ROLE_LABEL: Record<string, string> = {
  super_admin: "超级管理员",
  editor: "内容编辑",
  cs_hr: "客服/HR",
};

// 后台布局：左 Sider（Logo + 菜单树，按当前角色过滤）+ 顶栏（当前用户/退出）+ 内容区
export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const me = useAdminStore((s) => s.me);
  const logout = useAdminStore((s) => s.logout);

  const roleName = me?.role_name ?? "super_admin";
  const displayName = me?.display_name || me?.username || "管理员";

  const items = ADMIN_NAV.filter((i) => !i.roles || i.roles.includes(roleName as never)).map((i) => ({
    key: i.path,
    label: i.label,
  }));

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
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
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "#6B4F3A",
              color: "#fff",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            R
          </span>
          {!collapsed && "Rz家居 后台"}
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
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Tag color="default" style={{ borderRadius: 6 }}>
              {ROLE_LABEL[roleName] ?? roleName}
            </Tag>
            <Dropdown
              menu={{
                items: [
                  { key: "logout", icon: <LogoutOutlined />, label: "退出登录", onClick: handleLogout },
                ],
              }}
            >
              <span style={{ cursor: "pointer" }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ background: "#6B4F3A" }} />
                <span style={{ marginLeft: 8 }}>{displayName}</span>
              </span>
            </Dropdown>
          </div>
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
