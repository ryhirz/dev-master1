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
    "Rz智能家居始创于 1953 年，2015 年完成智能转型，是一家以全屋智能整装为核心的高端智能家居企业。我们以“全屋智能”为品牌主张，覆盖照明、安防、影音、睡眠与能源五大系统，致力于为每一个家庭带来从容、安静、有温度的高端生活体验。";
  const stats = company
    ? [
        { num: company.founded_year, label: "始创年份" },
        { num: company.honor_count, label: "荣誉奖项" },
        { num: company.production_line_count, label: "智能生产线" },
        { num: company.founded_year ? new Date().getFullYear() - company.founded_year : 72, label: "载智能深耕" },
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
