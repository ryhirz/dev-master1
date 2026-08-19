import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { Breadcrumb, PageContainer, Empty } from "../components/ui";

export default function AboutHistory() {
  const { data, loading } = useApi(() => api.history(), []);

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首页", to: "/" }, { label: "关于我们", to: "/about" }, { label: "发展历程" }]} />
      <div className="mb-8">
        <p className="text-walnut tracking-[0.3em] uppercase text-xs mb-2">关于我们</p>
        <h1 className="font-serif text-[32px] text-ink">发展历程</h1>
      </div>
      {loading ? (
        <p className="text-muted">加载中…</p>
      ) : data && data.length > 0 ? (
        <div className="relative max-w-2xl mx-auto pl-7">
          <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-line" />
          {data.map((m) => (
            <div key={m.id} className="relative pb-9 last:pb-0">
              <span className="absolute -left-7 top-1 w-4 h-4 rounded-full bg-walnut border-[3px] border-cream" />
              <div className="font-serif text-[22px] font-bold text-walnut">{m.year}</div>
              <div className="text-[17px] font-semibold text-ink mt-1">{m.title}</div>
              {m.description && <p className="text-muted mt-1">{m.description}</p>}
            </div>
          ))}
        </div>
      ) : (
        <Empty title="暂无发展历程内容" />
      )}
    </PageContainer>
  );
}
