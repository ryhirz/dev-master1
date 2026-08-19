import client from "./client";
import type {
  Banner,
  Product,
  ProductSeries,
  CaseItem,
  NewsItem,
  Job,
  Milestone,
  AboutSection,
  CompanyInfo,
  HomeOverview,
  AboutOverview,
  Paged,
  InquiryPayload,
} from "../types";

// 统一解包信封：后端返回 { code, message, data, request_id }
async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export interface ProductQuery {
  series_id?: number | null;
  category_id?: number | null;
  keyword?: string | null;
  page?: number;
  page_size?: number;
}

export interface CaseQuery {
  category?: string | null;
  page?: number;
  page_size?: number;
}

export interface NewsQuery {
  category?: string | null;
  page?: number;
  page_size?: number;
}

export interface JobQuery {
  type?: string | null;
  page?: number;
  page_size?: number;
}

export const api = {
  // 首页聚合
  homeOverview: () => unwrap<HomeOverview>(client.get("/home/overview")),

  // 系列（用于产品筛选下拉）
  series: () => unwrap<Paged<ProductSeries>>(client.get("/series")),

  // 产品
  products: (q: ProductQuery = {}) =>
    unwrap<Paged<Product>>(
      client.get("/products", {
        params: {
          series_id: q.series_id ?? undefined,
          category_id: q.category_id ?? undefined,
          keyword: q.keyword || undefined,
          page: q.page ?? 1,
          page_size: q.page_size ?? 12,
        },
      }),
    ),
  product: (id: string | number) =>
    unwrap<{ product: Product; related: Product[] }>(client.get(`/products/${id}`)),

  // 案例
  cases: (q: CaseQuery = {}) =>
    unwrap<Paged<CaseItem>>(
      client.get("/cases", {
        params: { category: q.category || undefined, page: q.page ?? 1, page_size: q.page_size ?? 12 },
      }),
    ),
  case: (id: string | number) => unwrap<CaseItem>(client.get(`/cases/${id}`)),

  // 新闻
  news: (q: NewsQuery = {}) =>
    unwrap<Paged<NewsItem>>(
      client.get("/news", {
        params: { category: q.category || undefined, page: q.page ?? 1, page_size: q.page_size ?? 12 },
      }),
    ),
  newsItem: (id: string | number) => unwrap<NewsItem>(client.get(`/news/${id}`)),

  // 关于
  aboutOverview: () => unwrap<AboutOverview>(client.get("/about/overview")),
  history: () => unwrap<Milestone[]>(client.get("/about/history")),
  brand: () => unwrap<AboutSection>(client.get("/about/brand")),
  contactInfo: () => unwrap<Partial<CompanyInfo>>(client.get("/contact/info")),

  // 招聘
  jobs: (q: JobQuery = {}) =>
    unwrap<Paged<Job>>(
      client.get("/jobs", {
        params: { type: q.type || undefined, page: q.page ?? 1, page_size: q.page_size ?? 20 },
      }),
    ),
  job: (id: string | number) => unwrap<Job>(client.get(`/jobs/${id}`)),

  // 前台轮播（仅启用）
  banners: () => unwrap<Banner[]>(client.get("/banners")),

  // 留言 / 求职意向
  inquiry: (payload: InquiryPayload) => client.post("/inquiries", payload).then((r) => r.data),
};

export type { Banner, Product, ProductSeries, CaseItem, NewsItem, Job, Milestone, AboutSection, CompanyInfo };
