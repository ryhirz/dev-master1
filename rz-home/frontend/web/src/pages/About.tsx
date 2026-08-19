import { Link } from "react-router-dom";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { Breadcrumb, PageContainer } from "../components/ui";

export default function About() {
  const { data } = useApi(() => api.aboutOverview(), []);
  const company = data?.company;
  const overview = data?.overview;
  const intro =
    overview?.content ||
    company?.intro ||
    "Rz家居始创于 1953 年，是一家集研发、制造、销售于一体的家居企业。我们以“家居美学”为品牌主张，坚持原创设计与智能生产，致力于为每一个家庭带来温润、可靠、经得起时间的家居体验。";
  const stats = company
    ? [
        { num: company.founded_year, label: "始创年份" },
        { num: company.honor_count, label: "荣誉奖项" },
        { num: company.production_line_count, label: "智能生产线" },
        { num: company.founded_year ? new Date().getFullYear() - company.founded_year : 72, label: "载匠心传承" },
      ]
    : [];

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首页", to: "/" }, { label: "关于我们" }]} />
      <div className="mb-2">
        <p className="text-walnut tracking-[0.3em] uppercase text-xs mb-2">关于我们</p>
        <h1 className="font-serif text-[32px] text-ink">关于 Rz</h1>
      </div>
      <p className="prose-rz max-w-3xl">{intro}</p>
      {stats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {stats.map((s, i) => (
            <div key={i} className="bg-sand rounded-card p-7 text-center text-ink">
              <div className="font-serif text-[40px] font-bold leading-none">{s.num}</div>
              <div className="mt-2 text-sm opacity-80">{s.label}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-3 mt-10">
        <Link to="/about/history" className="inline-flex items-center gap-2 h-11 px-6 rounded-btn border border-walnut text-walnut hover:bg-line/60 transition-colors text-[15px]">发展历程</Link>
        <Link to="/about/brand" className="inline-flex items-center gap-2 h-11 px-6 rounded-btn border border-walnut text-walnut hover:bg-line/60 transition-colors text-[15px]">品牌介绍</Link>
        <Link to="/about/contact" className="inline-flex items-center gap-2 h-11 px-6 rounded-btn bg-walnut text-cream hover:bg-walnut-d transition-colors text-[15px]">联系我们</Link>
      </div>
    </PageContainer>
  );
}
