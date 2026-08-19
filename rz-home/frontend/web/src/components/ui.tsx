import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { PLACEHOLDER_GRADIENT } from "../theme";
import { EmptyIcon } from "./Icons";

/* ---------------- Button ---------------- */
type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-btn font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
const btnVariants: Record<Variant, string> = {
  primary: "bg-walnut text-cream hover:bg-walnut-d",
  secondary: "border border-walnut text-walnut hover:bg-line/60",
  ghost: "text-walnut hover:bg-line/60",
};
const btnSizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[15px]",
  lg: "h-12 px-7 text-[15px]",
};
export function Button({
  variant = "primary", size = "md", loading, children, className, disabled, ...rest
}: BtnProps) {
  return (
    <button
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className || ""}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

/* ---------------- Tag ---------------- */
type TagVariant = "neutral" | "brand" | "new" | "success" | "warning" | "danger";
const tagStyles: Record<TagVariant, string> = {
  neutral: "bg-line text-muted",
  brand: "bg-walnut/10 text-walnut",
  new: "bg-warning/15 text-warning",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/12 text-danger",
};
export function Tag({
  children, variant = "neutral", className,
}: { children: ReactNode; variant?: TagVariant; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tagStyles[variant]} ${className || ""}`}>
      {children}
    </span>
  );
}

/* ---------------- ImagePlaceholder ---------------- */
export function ImagePlaceholder({
  label, ratio = "4/3", className,
}: { label?: string; ratio?: string; className?: string }) {
  return (
    <div
      className={`relative w-full overflow-hidden flex items-center justify-center text-cream font-serif select-none ${className || ""}`}
      style={{ aspectRatio: ratio, background: PLACEHOLDER_GRADIENT }}
    >
      <span className="text-2xl opacity-90">{label || "Rz"}</span>
    </div>
  );
}

/* ---------------- Skeleton ---------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-line/70 ${className || ""}`} />;
}
export function CardSkeleton({ ratio = "4/3" }: { ratio?: string }) {
  return (
    <div className="bg-white rounded-card border border-line overflow-hidden">
      <div className="animate-pulse bg-line/70 w-full" style={{ aspectRatio: ratio }} />
      <div className="p-4 space-y-2">
        <div className="animate-pulse bg-line/70 h-4 w-2/3 rounded" />
        <div className="animate-pulse bg-line/70 h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}
export function GridSkeleton({ count = 6, ratio = "4/3" }: { count?: number; ratio?: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} ratio={ratio} />
      ))}
    </div>
  );
}

/* ---------------- Empty ---------------- */
export function Empty({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="text-center py-16 text-muted">
      <div className="mx-auto mb-3 text-sand"><EmptyIcon className="w-14 h-14" /></div>
      <p className="mb-4">{title}</p>
      {action}
    </div>
  );
}

/* ---------------- Pagination ---------------- */
export function Pagination({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const btn =
    "w-11 h-11 rounded-btn border border-line bg-white text-ink flex items-center justify-center transition-colors hover:bg-line/60 disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button className={btn} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="上一页">‹</button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          aria-current={p === page ? "page" : undefined}
          className={`${btn} ${p === page ? "bg-walnut text-cream border-walnut" : ""}`}
        >
          {p}
        </button>
      ))}
      <button className={btn} disabled={page === totalPages} onClick={() => onChange(page + 1)} aria-label="下一页">›</button>
    </div>
  );
}

/* ---------------- Tabs ---------------- */
interface TabItem { key: string; label: string; }
export function Tabs({
  tabs, active, onChange,
}: { tabs: TabItem[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-line mb-7">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-3 text-base font-serif font-semibold border-b-2 transition-colors ${
            active === t.key ? "text-walnut border-walnut" : "text-muted border-transparent hover:text-walnut"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Breadcrumb ---------------- */
interface Crumb { label: string; to?: string; }
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted py-6" aria-label="面包屑">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          {c.to ? (
            <Link to={c.to} className="hover:text-walnut">{c.label}</Link>
          ) : (
            <span className="text-walnut">{c.label}</span>
          )}
          {i < items.length - 1 && <span className="opacity-50">›</span>}
        </span>
      ))}
    </nav>
  );
}

/* ---------------- SectionHeading ---------------- */
export function SectionHeading({
  eyebrow, title, subtitle, align = "center",
}: { eyebrow?: string; title: string; subtitle?: string; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "text-center mb-10" : "text-left mb-6"}>
      {eyebrow && (
        <p className="text-walnut tracking-[0.3em] uppercase text-xs mb-2 font-medium">{eyebrow}</p>
      )}
      <h2 className="font-serif text-[30px] text-ink">{title}</h2>
      {subtitle && <p className="text-muted mt-2">{subtitle}</p>}
    </div>
  );
}

/* ---------------- PageContainer ---------------- */
export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className || ""}`}>{children}</div>;
}
