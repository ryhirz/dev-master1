import { useEffect } from "react";
import type { ReactNode } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import AdminLayout from "./layouts/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Series from "./pages/Series";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Cases from "./pages/Cases";
import News from "./pages/News";
import AboutContent from "./pages/AboutContent";
import Jobs from "./pages/Jobs";
import Messages from "./pages/Messages";
import Banners from "./pages/Banners";
import Admins from "./pages/Admins";
import Roles from "./pages/Roles";
import Stats from "./pages/Stats";
import { useAdminStore } from "./store";

// 路由守卫：/me 拉取完成前显示加载；未登录（无 me）重定向 /login
function RequireAuth({ children }: { children: ReactNode }) {
  const me = useAdminStore((s) => s.me);
  const loaded = useAdminStore((s) => s.loaded);
  const location = useLocation();

  if (!loaded) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 120 }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!me) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

// 后台路由表（14，对齐 prototype_admin.html 与 UI/UX §4/§7）
export default function App() {
  const fetchMe = useAdminStore((s) => s.fetchMe);
  const loaded = useAdminStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) void fetchMe();
  }, [loaded, fetchMe]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/content/series" element={<Series />} />
        <Route path="/content/categories" element={<Categories />} />
        <Route path="/content/products" element={<Products />} />
        <Route path="/content/cases" element={<Cases />} />
        <Route path="/content/news" element={<News />} />
        <Route path="/content/about" element={<AboutContent />} />
        <Route path="/recruit/jobs" element={<Jobs />} />
        <Route path="/interaction/messages" element={<Messages />} />
        <Route path="/display/banners" element={<Banners />} />
        <Route path="/system/admins" element={<Admins />} />
        <Route path="/system/roles" element={<Roles />} />
        <Route path="/stats" element={<Stats />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
