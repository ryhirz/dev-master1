import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="font-serif text-[90px] font-bold text-sand leading-none">404</div>
      <h2 className="font-serif text-2xl text-ink mt-4">页面走丢了</h2>
      <p className="text-muted mt-2">您访问的页面不存在或已下架。</p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 h-11 px-6 rounded-btn bg-walnut text-cream hover:bg-walnut-d transition-colors text-[15px]"
      >
        返回首页
      </Link>
    </div>
  );
}
