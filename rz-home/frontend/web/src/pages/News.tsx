import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { Breadcrumb, PageContainer, Pagination, Empty, GridSkeleton, Tabs } from "../components/ui";
import { NewsCard } from "../components/cards";

const TABS = [
  { key: "all", label: "全部" },
  { key: "company", label: "企业新闻" },
  { key: "industry", label: "行业资讯" },
];

export default function News() {
  const [cat, setCat] = useState("all");
  const [page, setPage] = useState(1);
  const { data, loading } = useApi(() => api.news({ category: cat === "all" ? null : cat, page }), [cat, page]);

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首页", to: "/" }, { label: "新闻动态" }]} />
      <div className="mb-2">
        <p className="text-walnut tracking-[0.3em] uppercase text-xs mb-2">新闻</p>
        <h1 className="font-serif text-[32px] text-ink">新闻资讯</h1>
      </div>
      <Tabs tabs={TABS} active={cat} onChange={(k) => { setCat(k); setPage(1); }} />
      {loading ? (
        <GridSkeleton count={6} ratio="3/2" />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((n) => (
              <NewsCard key={n.id} n={n} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={Math.ceil(data.total / data.page_size)} onChange={setPage} />
        </>
      ) : (
        <Empty title="暂无新闻" />
      )}
    </PageContainer>
  );
}
