import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { Breadcrumb, PageContainer, Pagination, Empty, GridSkeleton, Tabs } from "../components/ui";
import { CaseCard } from "../components/cards";

const CATS = [
  { key: "all", label: "全部" },
  { key: "住宅", label: "住宅" },
  { key: "工程", label: "工程" },
  { key: "商业", label: "商业" },
];

export default function Cases() {
  const [cat, setCat] = useState("all");
  const [page, setPage] = useState(1);
  const { data, loading } = useApi(() => api.cases({ category: cat === "all" ? null : cat, page }), [cat, page]);

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首页", to: "/" }, { label: "产品", to: "/products" }, { label: "新案例展示" }]} />
      <div className="mb-2">
        <p className="text-walnut tracking-[0.3em] uppercase text-xs mb-2">产品 / 新案例展示</p>
        <h1 className="font-serif text-[32px] text-ink">新案例展示</h1>
      </div>
      <Tabs tabs={CATS} active={cat} onChange={(k) => { setCat(k); setPage(1); }} />
      {loading ? (
        <GridSkeleton count={6} ratio="16/9" />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={Math.ceil(data.total / data.page_size)} onChange={setPage} />
        </>
      ) : (
        <Empty title="暂无案例" />
      )}
    </PageContainer>
  );
}
