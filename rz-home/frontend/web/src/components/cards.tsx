import { Link } from "react-router-dom";
import type { Product, CaseItem, NewsItem, Job } from "../types";
import { ImagePlaceholder, Tag } from "./ui";

export function ProductCard({ p }: { p: Product }) {
  const cover = p.images?.[0];
  return (
    <Link
      to={`/products/${p.id}`}
      className="group block bg-white rounded-card border border-line shadow-sm hover:shadow-md transition-shadow"
    >
      {cover ? (
        <img src={cover} alt={p.name} className="w-full object-cover" style={{ aspectRatio: "4/3" }} />
      ) : (
        <ImagePlaceholder label={p.name.slice(0, 2)} ratio="4/3" />
      )}
      <div className="p-4">
        <div className="text-lg font-semibold text-ink group-hover:text-walnut transition-colors">{p.name}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted">
          {p.model_no && <span>型号 {p.model_no}</span>}
          {p.price != null && <span>¥ {p.price.toLocaleString()}</span>}
        </div>
        {p.summary && <p className="mt-2 text-sm text-muted line-clamp-2">{p.summary}</p>}
      </div>
    </Link>
  );
}

export function CaseCard({ c }: { c: CaseItem }) {
  const cover = c.images?.[0] ?? c.cover_image;
  return (
    <Link
      to={`/cases/${c.id}`}
      className="group block bg-white rounded-card border border-line shadow-sm hover:shadow-md transition-shadow"
    >
      {cover ? (
        <img src={cover} alt={c.title} className="w-full object-cover" style={{ aspectRatio: "16/9" }} />
      ) : (
        <ImagePlaceholder label={c.category} ratio="16/9" />
      )}
      <div className="p-4">
        <div className="flex justify-between items-center gap-2">
          <div className="text-[17px] font-semibold text-ink group-hover:text-walnut transition-colors">{c.title}</div>
          {c.is_new && <Tag variant="new">新</Tag>}
        </div>
        {c.summary && <p className="mt-2 text-sm text-muted line-clamp-2">{c.summary}</p>}
      </div>
    </Link>
  );
}

export function NewsCard({ n }: { n: NewsItem }) {
  const cover = n.cover_image;
  return (
    <Link
      to={`/news/${n.id}`}
      className="group block bg-white rounded-card border border-line shadow-sm hover:shadow-md transition-shadow"
    >
      {cover ? (
        <img src={cover} alt={n.title} className="w-full object-cover" style={{ aspectRatio: "3/2" }} />
      ) : (
        <ImagePlaceholder label={n.category === "company" ? "企业" : "行业"} ratio="3/2" />
      )}
      <div className="p-4">
        <div className="text-[17px] font-semibold text-ink group-hover:text-walnut transition-colors">{n.title}</div>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted">
          {n.published_at && <span>{n.published_at.slice(0, 10)}</span>}
          {n.is_top && <Tag variant="brand">置顶</Tag>}
        </div>
        {n.summary && <p className="mt-2 text-sm text-muted line-clamp-2">{n.summary}</p>}
      </div>
    </Link>
  );
}

export function JobCard({ j }: { j: Job }) {
  return (
    <Link
      to={`/jobs/${j.id}`}
      className="group block bg-white rounded-card border border-line shadow-sm hover:shadow-md transition-shadow p-5"
    >
      <div className="flex justify-between items-start gap-2">
        <div className="text-lg font-semibold text-ink group-hover:text-walnut transition-colors">{j.title}</div>
        <Tag variant="brand">{j.type === "social" ? "社会招聘" : "校园招聘"}</Tag>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
        {j.department && <span>{j.department}</span>}
        {j.city && <span>{j.city}</span>}
        {j.salary && <span>{j.salary}</span>}
        {j.headcount != null && <span>招聘 {j.headcount} 人</span>}
      </div>
      {j.description && <p className="mt-2 text-sm text-muted line-clamp-2">{j.description}</p>}
    </Link>
  );
}
