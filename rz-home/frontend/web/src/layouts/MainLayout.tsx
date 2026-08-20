import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NAV, type NavItem } from "../router";
import { BRAND } from "../theme";
import { SearchIcon, MenuIcon, ChevronDown, PhoneIcon, MailIcon, MapPin, ChatIcon } from "../components/Icons";

// 全局框架：顶部导航（5 主导航 + 关于我们二级下拉 / 移动抽屉）+ 页脚三栏 + 搜索入口（对齐 prototype §3.1 / UI/UX §3.1）
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const basePath = (p: string) => p.split("?")[0];
  const isActive = (p: string) => {
    const b = basePath(p);
    return b === "/" ? pathname === "/" : pathname.startsWith(b);
  };

  const onSearch = () => {
    const kw = search.trim();
    if (kw) navigate(`/products?keyword=${encodeURIComponent(kw)}`);
  };

  return (
    <div className="min-h-full flex flex-col bg-cream text-ink">
      <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="Rz智能家居 首页">
            <span className="w-10 h-10 rounded-btn bg-walnut text-cream flex items-center justify-center font-serif font-bold text-xl">Rz</span>
            <span className="font-serif text-xl text-walnut-d font-semibold">{BRAND.name}</span>
          </Link>

          {/* 桌面导航 */}
          <nav className="hidden lg:flex items-center gap-1 h-full" aria-label="主导航">
            {NAV.map((item) => (
              <div key={item.path} className="relative h-full flex items-center group">
                <Link
                  to={item.path}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  className={`flex items-center gap-1 px-4 h-11 text-[15px] transition-colors ${
                    isActive(item.path) ? "text-walnut font-medium" : "text-ink hover:text-walnut"
                  }`}
                >
                  {item.label}
                  {item.children && <ChevronDown className="w-4 h-4 opacity-60" />}
                </Link>
                {item.children && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50">
                    <div className="bg-white rounded-xl shadow-lg ring-1 ring-line py-2 min-w-[200px]">
                      {item.children.map((c) => (
                        <Link
                          key={c.path}
                          to={c.path}
                          className="block px-4 py-2.5 text-sm text-ink hover:text-walnut hover:bg-cream rounded-md mx-1"
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* 右侧操作 */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center relative">
              <SearchIcon className="absolute left-3 w-4 h-4 text-muted pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                placeholder="搜索产品"
                aria-label="搜索产品"
                className="w-40 h-10 pl-9 pr-3 rounded-btn border border-line bg-white text-sm outline-none focus:border-walnut"
              />
            </div>
            <Link
              to="/about/contact"
              className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-btn bg-walnut text-cream text-sm hover:bg-walnut-d transition-colors"
            >
              <ChatIcon className="w-4 h-4" /> 在线留言
            </Link>
            <button
              className="lg:hidden w-11 h-11 rounded-btn flex items-center justify-center hover:bg-line/60 text-ink"
              onClick={() => setMobileOpen(true)}
              aria-label="打开菜单"
              aria-expanded={mobileOpen}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* 移动端抽屉 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[1100]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 right-0 h-full w-[300px] max-w-[88vw] bg-cream shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-line">
              <span className="font-serif text-lg text-walnut-d font-semibold">导航</span>
              <button
                className="w-10 h-10 rounded-btn flex items-center justify-center hover:bg-line/60"
                onClick={() => setMobileOpen(false)}
                aria-label="关闭菜单"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {NAV.map((item, i) => (
                <div key={item.path} className="border-b border-line">
                  {item.children ? (
                    <>
                      <button
                        className="w-full flex items-center justify-between px-2 py-4 text-left font-serif text-[17px] text-ink"
                        onClick={() => setOpenIdx(openIdx === i ? null : i)}
                        aria-expanded={openIdx === i}
                      >
                        {item.label}
                        <ChevronDown className={`w-4 h-4 transition-transform ${openIdx === i ? "rotate-180" : ""}`} />
                      </button>
                      {openIdx === i && (
                        <div className="pb-3">
                          {item.children.map((c) => (
                            <Link
                              key={c.path}
                              to={c.path}
                              onClick={() => setMobileOpen(false)}
                              className="block px-4 py-2.5 text-sm text-muted hover:text-walnut"
                            >
                              {c.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="block px-2 py-4 font-serif text-[17px] text-ink hover:text-walnut"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-line">
              <Link
                to="/about/contact"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 h-12 rounded-btn bg-walnut text-cream text-sm hover:bg-walnut-d transition-colors"
              >
                <ChatIcon className="w-4 h-4" /> 在线留言
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* 页脚 */}
      <footer className="border-t border-line bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-muted">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-btn bg-walnut text-cream flex items-center justify-center font-serif font-bold">Rz</span>
              <span className="font-serif text-lg text-walnut-d font-semibold">{BRAND.name}</span>
            </div>
            <p className="text-xs tracking-[0.25em] text-walnut mb-3">{BRAND.enName} · {BRAND.slogan}</p>
            <p className="max-w-sm">以设计为骨，以科技为翼。专注高端全屋智能整装，从灯光到安防、从影音到睡眠，为每一个家庭带来从容智慧的生活体验。</p>
          </div>
          <div>
            <div className="text-ink font-medium mb-3">快速导航</div>
            <div className="grid grid-cols-2 gap-y-2">
              {NAV.map((i: NavItem) => (
                <Link key={i.path} to={i.path} className="hover:text-walnut">{i.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <div className="text-ink font-medium mb-3">联系方式</div>
            <p className="flex items-center gap-2 mb-2"><PhoneIcon className="w-4 h-4 text-walnut" /> 400-888-9999</p>
            <p className="flex items-center gap-2 mb-2"><MailIcon className="w-4 h-4 text-walnut" /> contact@rz-home.example</p>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-walnut" /> 广州市天河区珠江新城国际金融中心（ifc）</p>
          </div>
        </div>
        <div className="text-center text-xs text-muted py-4 border-t border-line">
          © {new Date().getFullYear()} {BRAND.name} · ICP 备（占位） · 隐私政策
        </div>
      </footer>
    </div>
  );
}
