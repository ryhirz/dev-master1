import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { SectionHeading, Empty, GridSkeleton } from "../components/ui";
import { ProductCard, CaseCard, NewsCard } from "../components/cards";
import { ArrowRight } from "../components/Icons";
import { BRAND } from "../theme";
import type { Banner } from "../types";

const DEFAULT_BANNERS: Banner[] = [
  { id: 0, title: "全屋智能，重新定义理想之家", image: "", link_url: "/products", sort_order: 0, status: "active" },
  { id: 1, title: "实景案例 · 智能生活的温度", image: "", link_url: "/cases", sort_order: 1, status: "active" },
  { id: 2, title: "加入 Rz 智能，与科技同行", image: "", link_url: "/jobs", sort_order: 2, status: "active" },
];

function isImg(s?: string | null) {
  return !!s && (/^https?:\/\//.test(s) || s.startsWith("/static"));
}

function Hero({ banners }: { banners: Banner[] }) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setCur((c) => (c + 1) % banners.length), 4500);
    return () => clearInterval(t);
  }, [banners.length]);
  if (!banners.length) return null;
  const b = banners[cur];
  return (
    <section className="relative h-[420px] md:h-[560px] overflow-hidden bg-walnut-d">
      {banners.map((s, i) => (
        <div key={s.id} className={`absolute inset-0 transition-opacity duration-700 ${i === cur ? "opacity-100" : "opacity-0"}`}>
          {isImg(s.image) ? (
            <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "linear-gradient(120deg,#4A3728,#6B4F3A 60%,#C8A97E)" }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(31,27,22,.7),rgba(31,27,22,.15))" }} />
        </div>
      ))}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
        <div className="text-cream max-w-2xl">
          <p className="text-sand text-xs tracking-[0.3em] uppercase mb-3">{BRAND.enName} · {BRAND.slogan}</p>
          <h1 className="font-serif text-[32px] md:text-[46px] leading-tight">{b.title}</h1>
          <Link
            to={b.link_url || "/products"}
            className="mt-6 inline-flex items-center gap-2 h-12 px-7 rounded-btn bg-walnut text-cream hover:bg-walnut-d transition-colors text-[15px]"
          >
            了解更多 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      {banners.length > 1 && (
        <>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-[2]">
            {banners.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCur(i)}
                aria-label={`第${i + 1}张`}
                className={`h-2.5 rounded-full transition-all ${i === cur ? "w-7 bg-cream" : "w-2.5 bg-cream/50"}`}
              />
            ))}
          </div>
          <button
            onClick={() => setCur((c) => (c - 1 + banners.length) % banners.length)}
            aria-label="上一张"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-cream flex items-center justify-center z-[2]"
          >
            ‹
          </button>
          <button
            onClick={() => setCur((c) => (c + 1) % banners.length)}
            aria-label="下一张"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-cream flex items-center justify-center z-[2]"
          >
            ›
          </button>
        </>
      )}
    </section>
  );
}

export default function Home() {
  const { data, loading } = useApi(() => api.homeOverview(), []);
  const banners = data?.banners?.length ? data.banners : DEFAULT_BANNERS;
  const company = data?.company;
  const stats = company
    ? [
        { num: company.founded_year, label: "始创年份" },
        { num: company.honor_count, label: "荣誉奖项" },
        { num: company.production_line_count, label: "智能生产线" },
        { num: company.founded_year ? new Date().getFullYear() - company.founded_year : 72, label: "载智能深耕" },
      ]
    : [];

  return (
    <>
      <Hero banners={banners} />

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-walnut tracking-[0.3em] uppercase text-xs mb-3">{BRAND.enName} · {BRAND.slogan}</p>
          <h2 className="font-serif text-[38px] text-ink">全屋智能，重新定义理想之家</h2>
          <p className="text-muted max-w-2xl mx-auto mt-4 text-[17px]">70+ 年匠心传承，2015 年智能转型——从灯光到安防，从影音到睡眠，一个中枢掌控全部。</p>
        </div>
      </section>

      {stats.length > 0 && (
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <div key={i} className="bg-sand rounded-card p-7 text-center text-ink">
                  <div className="font-serif text-[40px] font-bold leading-none">{s.num}</div>
                  <div className="mt-2 text-sm opacity-80">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-14 bg-white border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="推荐产品" title="精选之作" subtitle="来自各系列的口碑之选" />
          {loading ? (
            <GridSkeleton count={4} />
          ) : data && data.recommended_products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {data.recommended_products.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
              <div className="text-center">
                <Link to="/products" className="inline-flex items-center gap-1.5 mt-8 text-walnut font-medium hover:gap-2.5 transition-all">
                  查看全部产品 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <Empty title="暂无推荐产品" />
          )}
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="新案例展示" title="见生活的温度" subtitle="住宅 / 工程 / 商业全场景" />
          {loading ? (
            <GridSkeleton count={3} ratio="16/9" />
          ) : data && data.latest_cases.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {data.latest_cases.map((c) => (
                  <CaseCard key={c.id} c={c} />
                ))}
              </div>
              <div className="text-center">
                <Link to="/cases" className="inline-flex items-center gap-1.5 mt-8 text-walnut font-medium hover:gap-2.5 transition-all">
                  查看全部案例 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <Empty title="暂无案例" />
          )}
        </div>
      </section>

      <section className="py-14 bg-white border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="最新动态" title="新闻资讯" />
          {loading ? (
            <GridSkeleton count={3} ratio="3/2" />
          ) : data && data.latest_news.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {data.latest_news.map((n) => (
                  <NewsCard key={n.id} n={n} />
                ))}
              </div>
              <div className="text-center">
                <Link to="/news" className="inline-flex items-center gap-1.5 mt-8 text-walnut font-medium hover:gap-2.5 transition-all">
                  查看全部新闻 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <Empty title="暂无新闻" />
          )}
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-walnut to-walnut-d rounded-2xl p-10 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-cream">
            <div>
              <p className="text-sand text-xs tracking-[0.3em] uppercase mb-2">加入我们</p>
              <h2 className="font-serif text-[28px]">与美同行，正在招募</h2>
              <p className="opacity-90 mt-2 max-w-md">无论你是资深专家，还是校园新星，Rz智能都为你留有位置。</p>
            </div>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 h-12 px-7 rounded-btn bg-cream text-walnut hover:opacity-90 transition-opacity text-[15px] font-medium"
            >
              查看招聘职位 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
