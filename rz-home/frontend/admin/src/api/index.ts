import client, { unwrap } from "./client";
import type {
  AdminCreatePayload,
  AdminListItem,
  AdminMe,
  AdminUpdatePayload,
  AboutSectionItem,
  AboutSectionPayload,
  BannerItem,
  BannerPayload,
  CaseItem,
  CasePayload,
  CategoryItem,
  CategoryPayload,
  CompanyInfo,
  CompanyInfoPayload,
  JobItem,
  JobPayload,
  LoginPayload,
  MessageItem,
  MessagePayload,
  MilestoneItem,
  MilestonePayload,
  NewsItem,
  NewsPayload,
  Paged,
  ProductItem,
  ProductPayload,
  RoleItem,
  RolePayload,
  SeriesItem,
  SeriesPayload,
  StatsOverview,
  TokenData,
  UploadResult,
} from "../types";

// 通用分页参数
export interface PageParams {
  page?: number;
  page_size?: number;
}

/** 通用列表封装：get("/xxx", { params }) → unwrap<Paged<T>> */
function list<T>(path: string, params?: object) {
  return unwrap<Paged<T>>(client.get(path, { params }));
}

// ================= 鉴权 =================
export const authApi = {
  login: (body: LoginPayload) => unwrap<TokenData>(client.post("/admin/login", body)),
  refresh: (refresh_token: string) =>
    unwrap<{ access_token: string }>(client.post("/admin/refresh", { refresh_token })),
  logout: (refresh_token: string) => unwrap<null>(client.post("/admin/logout", { refresh_token })),
  me: () => unwrap<AdminMe>(client.get("/admin/me")),
};

// ================= 内容：系列 / 分类 =================
export const seriesApi = {
  list: (p?: PageParams) => list<SeriesItem>("/admin/series", p),
  create: (b: SeriesPayload) => unwrap<SeriesItem>(client.post("/admin/series", b)),
  update: (id: number, b: Partial<SeriesPayload>) => unwrap<SeriesItem>(client.put(`/admin/series/${id}`, b)),
  remove: (id: number) => unwrap<null>(client.delete(`/admin/series/${id}`)),
};

export const categoryApi = {
  list: (p?: PageParams) => list<CategoryItem>("/admin/categories", p),
  create: (b: CategoryPayload) => unwrap<CategoryItem>(client.post("/admin/categories", b)),
  update: (id: number, b: Partial<CategoryPayload>) =>
    unwrap<CategoryItem>(client.put(`/admin/categories/${id}`, b)),
  remove: (id: number) => unwrap<null>(client.delete(`/admin/categories/${id}`)),
};

// ================= 内容：产品 =================
export const productApi = {
  list: (p?: PageParams & { keyword?: string; series_id?: number; category_id?: number; status?: string }) =>
    list<ProductItem>("/admin/products", p),
  create: (b: ProductPayload) => unwrap<ProductItem>(client.post("/admin/products", b)),
  update: (id: number, b: Partial<ProductPayload>) => unwrap<ProductItem>(client.put(`/admin/products/${id}`, b)),
  remove: (id: number) => unwrap<null>(client.delete(`/admin/products/${id}`)),
};

// ================= 内容：案例 =================
export const caseApi = {
  list: (p?: PageParams & { category?: string; status?: string }) => list<CaseItem>("/admin/cases", p),
  create: (b: CasePayload) => unwrap<CaseItem>(client.post("/admin/cases", b)),
  update: (id: number, b: Partial<CasePayload>) => unwrap<CaseItem>(client.put(`/admin/cases/${id}`, b)),
  remove: (id: number) => unwrap<null>(client.delete(`/admin/cases/${id}`)),
};

// ================= 内容：新闻 =================
export const newsApi = {
  list: (p?: PageParams & { category?: string; status?: string }) => list<NewsItem>("/admin/news", p),
  create: (b: NewsPayload) => unwrap<NewsItem>(client.post("/admin/news", b)),
  update: (id: number, b: Partial<NewsPayload>) => unwrap<NewsItem>(client.put(`/admin/news/${id}`, b)),
  remove: (id: number) => unwrap<null>(client.delete(`/admin/news/${id}`)),
};

// ================= 内容：关于（区块/里程碑/公司信息） =================
export const aboutApi = {
  sections: () => unwrap<AboutSectionItem[]>(client.get("/admin/about-sections")),
  section: (code: string) => unwrap<AboutSectionItem>(client.get(`/admin/about-sections/${code}`)),
  updateSection: (code: string, b: AboutSectionPayload) =>
    unwrap<AboutSectionItem>(client.put(`/admin/about-sections/${code}`, b)),
  milestones: () => unwrap<MilestoneItem[]>(client.get("/admin/milestones")),
  createMilestone: (b: MilestonePayload) => unwrap<MilestoneItem>(client.post("/admin/milestones", b)),
  updateMilestone: (id: number, b: Partial<MilestonePayload>) =>
    unwrap<MilestoneItem>(client.put(`/admin/milestones/${id}`, b)),
  removeMilestone: (id: number) => unwrap<null>(client.delete(`/admin/milestones/${id}`)),
  company: () => unwrap<CompanyInfo>(client.get("/admin/company-info")),
  updateCompany: (b: CompanyInfoPayload) => unwrap<CompanyInfo>(client.put("/admin/company-info", b)),
};

// ================= 运营：职位 =================
export const jobApi = {
  list: (p?: PageParams & { type?: string; status?: string }) => list<JobItem>("/admin/jobs", p),
  create: (b: JobPayload) => unwrap<JobItem>(client.post("/admin/jobs", b)),
  update: (id: number, b: Partial<JobPayload>) => unwrap<JobItem>(client.put(`/admin/jobs/${id}`, b)),
  remove: (id: number) => unwrap<null>(client.delete(`/admin/jobs/${id}`)),
};

// ================= 运营：留言 =================
export const messageApi = {
  list: (p?: PageParams & { type?: string; status?: string }) => list<MessageItem>("/admin/messages", p),
  detail: (id: number) => unwrap<MessageItem>(client.get(`/admin/messages/${id}`)),
  update: (id: number, b: MessagePayload) => unwrap<MessageItem>(client.put(`/admin/messages/${id}`, b)),
  remove: (id: number) => unwrap<null>(client.delete(`/admin/messages/${id}`)),
};

// ================= 运营：轮播 =================
export const bannerApi = {
  list: (p?: PageParams) => list<BannerItem>("/admin/banners", p),
  create: (b: BannerPayload) => unwrap<BannerItem>(client.post("/admin/banners", b)),
  update: (id: number, b: Partial<BannerPayload>) => unwrap<BannerItem>(client.put(`/admin/banners/${id}`, b)),
  remove: (id: number) => unwrap<null>(client.delete(`/admin/banners/${id}`)),
};

// ================= 系统：管理员 / 角色 =================
export const adminApi = {
  list: (p?: PageParams) => list<AdminListItem>("/admin/admins", p),
  create: (b: AdminCreatePayload) => unwrap<AdminListItem>(client.post("/admin/admins", b)),
  update: (id: number, b: AdminUpdatePayload) => unwrap<AdminListItem>(client.put(`/admin/admins/${id}`, b)),
  remove: (id: number) => unwrap<null>(client.delete(`/admin/admins/${id}`)),
};

export const roleApi = {
  list: (p?: PageParams) => list<RoleItem>("/admin/roles", p),
  create: (b: RolePayload) => unwrap<RoleItem>(client.post("/admin/roles", b)),
  update: (id: number, b: Partial<RolePayload>) => unwrap<RoleItem>(client.put(`/admin/roles/${id}`, b)),
  remove: (id: number) => unwrap<null>(client.delete(`/admin/roles/${id}`)),
};

// ================= 统计 / 上传 =================
export const statsApi = {
  overview: () => unwrap<StatsOverview>(client.get("/admin/stats/overview")),
};

export const uploadApi = {
  // multipart 上传 → { url, filename }
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return unwrap<UploadResult>(client.post("/admin/upload", fd));
  },
};

export { list };
