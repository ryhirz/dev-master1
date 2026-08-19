import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import About from "./pages/About";
import AboutHistory from "./pages/AboutHistory";
import AboutBrand from "./pages/AboutBrand";
import AboutContact from "./pages/AboutContact";
import NotFound from "./pages/NotFound";

// 前台路由表（12+，对齐 prototype_frontend.html 与 UI/UX §3/§6）
export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/about/history" element={<AboutHistory />} />
        <Route path="/about/brand" element={<AboutBrand />} />
        <Route path="/about/contact" element={<AboutContact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}
