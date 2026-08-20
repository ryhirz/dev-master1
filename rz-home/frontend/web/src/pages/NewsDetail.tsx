import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { Breadcrumb, PageContainer, Empty, Tag } from "../components/ui";

export default function NewsDetail() {
  const { id } = useParams();
  const { data, loading } = useApi(() => api.newsItem(id!), [id]);

  if (loading) return <PageContainer><div className="py-20 text-center text-muted">加载中…</div></PageContainer>;
  if (!data) return <PageContainer><Empty title="新闻不存在或尚未发布" /></PageContainer>;

  return (
    <PageContainer className="max-w-[860px]">
      <Breadcrumb items={[{ label: "首页", to: "/" }, { label: "新闻动态", to: "/news" }, { label: data.title }]} />
      <p className="text-walnut tracking-[0.3em] uppercase text-xs mb-2 mt-2">{data.category === "company" ? "企业新闻" : "行业资讯"}</p>
      <h1 className="font-serif text-[32px] leading-snug text-ink">{data.title}</h1>
      <div className="flex items-center gap-2 mt-3 text-sm text-muted">
        <Tag variant="brand">{data.category === "company" ? "企业新闻" : "行业资讯"}</Tag>
        {data.published_at && <span>{data.published_at.slice(0, 10)}</span>}
        {data.is_top && <Tag variant="brand">置顶</Tag>}
      </div>
      <div className="prose-rz mt-6">
        <p>{data.content || data.summary}</p>
        <p>Rz智能家居持续以“全屋智能”为品牌主张，在设计、科技与服务之间寻找平衡，致力于为消费者带来更可信赖的智能生活体验。</p>
      </div>
      <div className="mt-8">
        <Link
          to="/news"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-btn border border-walnut text-walnut hover:bg-line/60 transition-colors text-[15px]"
        >
          返回新闻列表
        </Link>
      </div>
    </PageContainer>
  );
}
