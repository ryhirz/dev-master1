import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { Breadcrumb, PageContainer, Empty, Tag, ImagePlaceholder } from "../components/ui";

export default function CaseDetail() {
  const { id } = useParams();
  const { data, loading } = useApi(() => api.case(id!), [id]);
  const [active, setActive] = useState(0);

  if (loading) return <PageContainer><div className="py-20 text-center text-muted">加载中…</div></PageContainer>;
  if (!data) return <PageContainer><Empty title="案例不存在或已下架" /></PageContainer>;

  const images = data.images?.length ? data.images : data.cover_image ? [data.cover_image] : [];
  const mainImg = images[active] ?? null;

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首页", to: "/" }, { label: "新案例展示", to: "/cases" }, { label: data.title }]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-4">
        <div>
          {mainImg ? (
            <img src={mainImg} alt={data.title} className="w-full rounded-card object-cover" style={{ aspectRatio: "16/9" }} />
          ) : (
            <ImagePlaceholder label={data.category} ratio="16/9" />
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
          <h1 className="font-serif text-[32px] text-ink">{data.title}</h1>
          <div className="flex gap-2 mt-3">
            <Tag variant="brand">{data.category}</Tag>
            {data.is_new && <Tag variant="new">新案例</Tag>}
          </div>
          <div className="prose-rz mt-4" dangerouslySetInnerHTML={{ __html: data.content || data.summary || "" }} />
          <dl className="mt-5 border border-line rounded-btn overflow-hidden">
            <div className="grid grid-cols-2 border-b border-line">
              <dt className="bg-cream px-4 py-3 text-muted">项目分类</dt>
              <dd className="px-4 py-3">{data.category}</dd>
            </div>
            <div className="grid grid-cols-2 border-b border-line">
              <dt className="bg-cream px-4 py-3 text-muted">交付内容</dt>
              <dd className="px-4 py-3">家具整体方案</dd>
            </div>
            <div className="grid grid-cols-2">
              <dt className="bg-cream px-4 py-3 text-muted">服务范围</dt>
              <dd className="px-4 py-3">设计 / 生产 / 安装</dd>
            </div>
          </dl>
          <Link
            to="/cases"
            className="inline-flex items-center gap-2 h-11 px-6 mt-6 rounded-btn border border-walnut text-walnut hover:bg-line/60 transition-colors text-[15px]"
          >
            返回案例列表
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
