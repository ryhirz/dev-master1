// 前端实体类型（对齐后端 Pydantic schema / 数据库设计文档 §4）
// 注意：日期字段为字符串（后端 jsonable_encoder 输出 ISO 字符串）

export interface Banner {
  id: number;
  title: string;
  image: string;
  link_url?: string | null;
  sort_order: number;
  status: string;
}

export interface ProductSeries {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  cover_image?: string | null;
  sort_order: number;
  status: string;
}

export interface Product {
  id: number;
  series_id?: number | null;
  category_id?: number | null;
  series_name?: string | null;
  category_name?: string | null;
  name: string;
  model_no?: string | null;
  summary?: string | null;
  description?: string | null;
  images: string[];
  specs: Record<string, unknown>;
  price?: number | null;
  is_recommended: boolean;
  status: string;
}

export interface CaseItem {
  id: number;
  title: string;
  category: string; // 住宅 | 工程 | 商业
  cover_image?: string | null;
  images: string[];
  summary?: string | null;
  content?: string | null;
  is_new: boolean;
  sort_order: number;
  status: string;
}

export interface NewsItem {
  id: number;
  title: string;
  category: string; // company | industry
  cover_image?: string | null;
  summary?: string | null;
  content?: string | null;
  author?: string | null;
  is_top: boolean;
  status: string;
  published_at?: string | null;
}

export interface Job {
  id: number;
  type: string; // social | campus
  title: string;
  department?: string | null;
  city?: string | null;
  salary?: string | null;
  description?: string | null;
  requirements?: string | null;
  headcount?: number | null;
  status: string;
}

export interface Milestone {
  id: number;
  year: string;
  title: string;
  description?: string | null;
  image?: string | null;
}

export interface AboutSection {
  id: number;
  code: string; // overview | brand
  title: string;
  content?: string | null;
  cover_image?: string | null;
}

export interface CompanyInfo {
  id: number;
  name: string;
  logo_url?: string | null;
  founded_year?: number | null;
  honor_count?: number | null;
  production_line_count?: number | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  wechat?: string | null;
  icp_no?: string | null;
  intro?: string | null;
}

export interface HomeOverview {
  banners: Banner[];
  recommended_products: (Product & { series_name?: string | null; category_name?: string | null })[];
  company: CompanyInfo | null;
  latest_cases: CaseItem[];
  latest_news: NewsItem[];
  job_open_count: number;
}

export interface AboutOverview {
  company: CompanyInfo | null;
  overview?: AboutSection | null;
}

export interface Paged<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

export interface InquiryPayload {
  type: "contact" | "job_application";
  name: string;
  phone: string;
  email?: string;
  content: string;
  job_id?: number | null;
}
