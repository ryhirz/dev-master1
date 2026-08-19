import { Routes, Route, Navigate } from "react-router-dom";
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

// 后台路由表（14，对齐 prototype_admin.html 与 UI/UX §4/§7）
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AdminLayout />}>
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
