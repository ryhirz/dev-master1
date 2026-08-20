import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { Breadcrumb, PageContainer, Pagination, Empty, GridSkeleton, Tabs } from "../components/ui";
import { JobCard } from "../components/cards";

const TABS = [
  { key: "all", label: "全部" },
  { key: "social", label: "社会招聘" },
  { key: "campus", label: "校园招聘" },
];

export default function Jobs() {
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const { data, loading } = useApi(() => api.jobs({ type: type === "all" ? null : type, page }), [type, page]);

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首页", to: "/" }, { label: "招聘" }]} />
      <div className="mb-2">
        <p className="text-walnut tracking-[0.3em] uppercase text-xs mb-2">招聘入口</p>
        <h1 className="font-serif text-[32px] text-ink">加入 Rz智能</h1>
      </div>
      <Tabs tabs={TABS} active={type} onChange={(k) => { setType(k); setPage(1); }} />
      {loading ? (
        <GridSkeleton count={6} />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {data.items.map((j) => (
              <JobCard key={j.id} j={j} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={Math.ceil(data.total / data.page_size)} onChange={setPage} />
        </>
      ) : (
        <Empty title="暂无职位" />
      )}
    </PageContainer>
  );
}
