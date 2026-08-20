import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { Breadcrumb, PageContainer, SectionHeading, Empty, Tag, ImagePlaceholder } from "../components/ui";
import { ProductCard } from "../components/cards";

export default function ProductDetail() {
  const { id } = useParams();
  const { data, loading } = useApi(() => api.product(id!), [id]);
  const [active, setActive] = useState(0);

  if (loading) return <PageContainer><div className="py-20 text-center text-muted">加载中…</div></PageContainer>;
  if (!data) return <PageContainer><Empty title="产品不存在或已下架" /></PageContainer>;

  const p = data.product;
  const images = p.images?.length ? p.images : [];
  const mainImg = images[active] ?? null;

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首页", to: "/" }, { label: "产品中心", to: "/products" }, { label: p.name }]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-4">
        <div>
          {mainImg ? (
            <img src={mainImg} alt={p.name} className="w-full rounded-card object-cover" style={{ aspectRatio: "4/3" }} />
          ) : (
            <ImagePlaceholder label={p.name.slice(0, 2)} ratio="4/3" />
          )}
          {images.length > 1 && (
            <div className="flex gap-2.5 mt-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-[72px] h-[72px] rounded-btn overflow-hidden border-2 ${i === active ? "border-walnut" : "border-transparent"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="font-serif text-[32px] text-ink">{p.name}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            {p.series_name && <Tag variant="brand">系列 · {p.series_name}</Tag>}
            {p.category_name && <Tag>空间 · {p.category_name}</Tag>}
            {p.is_recommended && <Tag variant="new">首页推荐</Tag>}
          </div>
          {p.summary && <p className="prose-rz mt-4">{p.summary}</p>}
          {p.price != null && (
            <p className="mt-4 font-serif text-[22px] text-walnut font-bold">
              ¥ {p.price.toLocaleString()}{" "}
              <span className="text-sm text-muted font-normal">（展示参考价，不参与交易）</span>
            </p>
          )}
          {p.specs && Object.keys(p.specs).length > 0 && (
            <dl className="mt-5 border border-line rounded-btn overflow-hidden">
              {Object.entries(p.specs).map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 border-b border-line last:border-0">
                  <dt className="bg-cream px-4 py-3 text-muted">{k}</dt>
                  <dd className="px-4 py-3 text-ink">{String(v)}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="flex gap-3 mt-6">
            <Link
              to="/about/contact"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-btn bg-walnut text-cream hover:bg-walnut-d transition-colors text-[15px]"
            >
              咨询这款产品
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-btn border border-walnut text-walnut hover:bg-line/60 transition-colors text-[15px]"
            >
              返回列表
            </Link>
          </div>
        </div>
      </div>

      {p.description && (
        <div className="mt-14">
          <SectionHeading align="left" title="产品详情" />
          <div className="prose-rz mt-4" dangerouslySetInnerHTML={{ __html: p.description }} />
        </div>
      )}

      {data.related.length > 0 && (
        <div className="mt-14">
          <SectionHeading align="left" title="同系列推荐" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
