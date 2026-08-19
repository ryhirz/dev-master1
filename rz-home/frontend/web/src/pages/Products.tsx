import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { Breadcrumb, PageContainer, Pagination, Empty, GridSkeleton, Button } from "../components/ui";
import { ProductCard } from "../components/cards";
import { Select, Field, TextInput } from "../components/Field";

export default function Products() {
  const [seriesId, setSeriesId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  const { data: seriesData } = useApi(() => api.series(), []);
  const { data: allData } = useApi(() => api.products({ page_size: 100 }), []);
  const { data, loading } = useApi(
    () => api.products({ series_id: seriesId, category_id: categoryId, keyword: keyword || null, page }),
    [seriesId, categoryId, keyword, page],
  );

  const categories = useMemo(() => {
    const m = new Map<number, string>();
    (allData?.items || []).forEach((p) => {
      if (p.category_id != null) m.set(p.category_id, p.category_name || "未分类");
    });
    return [...m.entries()].map(([id, name]) => ({ id, name }));
  }, [allData]);

  const reset = () => {
    setSeriesId(null);
    setCategoryId(null);
    setKeyword("");
    setPage(1);
  };

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首页", to: "/" }, { label: "产品中心" }]} />
      <div className="mb-8">
        <p className="text-walnut tracking-[0.3em] uppercase text-xs mb-2">产品</p>
        <h1 className="font-serif text-[32px] text-ink">产品中心</h1>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-8">
        <Field label="系列" htmlFor="fSeries">
          <Select
            id="fSeries"
            value={seriesId ?? ""}
            onChange={(e) => {
              setSeriesId(e.target.value ? Number(e.target.value) : null);
              setPage(1);
            }}
          >
            <option value="">全部系列</option>
            {(seriesData?.items || []).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="空间分类" htmlFor="fCat">
          <Select
            id="fCat"
            value={categoryId ?? ""}
            onChange={(e) => {
              setCategoryId(e.target.value ? Number(e.target.value) : null);
              setPage(1);
            }}
          >
            <option value="">全部空间</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="关键词" htmlFor="fKw">
          <TextInput
            id="fKw"
            placeholder="产品名称 / 型号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setPage(1);
            }}
          />
        </Field>
        <Button variant="secondary" onClick={reset}>重置</Button>
      </div>

      {loading ? (
        <GridSkeleton count={6} />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={Math.ceil(data.total / data.page_size)} onChange={(p) => setPage(p)} />
          <p className="mt-4 text-sm text-muted">共 {data.total} 件产品</p>
        </>
      ) : (
        <Empty title="暂无符合条件的产品" action={<Link to="/products" className="text-walnut hover:underline">查看全部产品</Link>} />
      )}
    </PageContainer>
  );
}
