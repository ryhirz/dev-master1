// ===== 后台管理端类型定义（对齐 backend/app/schemas/*，字段与后端 Out 一致） =====

// ---- 通用 ----
export interface Paged<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

// 响应信封（后端 ok() 包装）：{ code, message, data, request_id }
export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
  request_id?: string;
}

// ---- 鉴权 ----
export interface LoginPayload {
  username: string;
  password: string;
}

export interface AdminUser {
  id: number;
  username: string;
  display_name: string | null;
  role_id: number;
  role_name: string | null;
  status: string;
  last_login_at: string | null;
  created_at: string | null;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  admin: AdminUser;
}

export interface AdminMe {
  id: number;
  username: string;
  display_name: string | null;
  role_name: string | null;
  role_permissions: Record<string, string[]>;
  status: string;
}

// ---- 产品系列 ----
export interface SeriesItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  sort_order: number;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
}
export interface SeriesPayload {
  name: string;
  slug: string;
  description?: string | null;
  cover_image?: string | null;
  sort_order?: number;
  status?: string;
}

// ---- 产品分类 ----
export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  parent_name: string | null;
  sort_order: number;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
}
export interface CategoryPayload {
  name: string;
  slug: string;
  parent_id?: number | null;
  sort_order?: number;
  status?: string;
}

// ---- 产品 ----
export interface ProductItem {
  id: number;
  series_id: number | null;
  category_id: number | null;
  series_name: string | null;
  category_name: string | null;
  name: string;
  model_no: string | null;
  summary: string | null;
  description: string | null;
  images: string[];
  specs: Record<string, unknown>;
  price: number | null;
  is_recommended: boolean;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
}
export interface ProductPayload {
  series_id?: number | null;
  category_id?: number | null;
  name: string;
  model_no?: string | null;
  summary?: string | null;
  description?: string | null;
  images?: string[];
  specs?: Record<string, unknown>;
  price?: number | null;
  is_recommended?: boolean;
  status?: string;
}

// ---- 案例 ----
export interface CaseItem {
  id: number;
  title: string;
  category: string; // 住宅 | 工程 | 商业
  cover_image: string | null;
  images: string[];
  summary: string | null;
  content: string | null;
  is_new: boolean;
  sort_order: number;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
}
export interface CasePayload {
  title: string;
  category?: string;
  cover_image?: string | null;
  images?: string[];
  summary?: string | null;
  content?: string | null;
  is_new?: boolean;
  sort_order?: number;
  status?: string;
}

// ---- 新闻 ----
export interface NewsItem {
  id: number;
  title: string;
  category: string; // company | industry
  cover_image: string | null;
  summary: string | null;
  content: string | null;
  author: string | null;
  is_top: boolean;
  status: string; // draft | published
  published_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
export interface NewsPayload {
  title: string;
  category?: string;
  cover_image?: string | null;
  summary?: string | null;
  content?: string | null;
  author?: string | null;
  is_top?: boolean;
  status?: string;
  published_at?: string | null;
}

// ---- 职位 ----
export interface JobItem {
  id: number;
  type: string; // social | campus
  title: string;
  department: string | null;
  city: string | null;
  salary: string | null;
  description: string | null;
  requirements: string | null;
  headcount: number | null;
  status: string;
  publish_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
export interface JobPayload {
  type?: string;
  title: string;
  department?: string | null;
  city?: string | null;
  salary?: string | null;
  description?: string | null;
  requirements?: string | null;
  headcount?: number | null;
  status?: string;
  publish_at?: string | null;
}

// ---- 留言 ----
export interface MessageItem {
  id: number;
  type: string; // contact | job_application
  ref_id: number | null;
  job_title: string | null;
  name: string;
  phone: string;
  email: string | null;
  content: string;
  status: string; // new | handled | ignored
  reply: string | null;
  replied_at: string | null;
  created_at: string | null;
}
export interface MessagePayload {
  status?: string;
  reply?: string | null;
}

// ---- 轮播 ----
export interface BannerItem {
  id: number;
  title: string;
  image: string;
  link_url: string | null;
  sort_order: number;
  status: string;
  start_time: string | null;
  end_time: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
export interface BannerPayload {
  title: string;
  image: string;
  link_url?: string | null;
  sort_order?: number;
  status?: string;
  start_time?: string | null;
  end_time?: string | null;
}

// ---- 关于区块 ----
export interface AboutSectionItem {
  id: number;
  code: string; // overview | brand
  title: string;
  content: string | null;
  cover_image: string | null;
  sort_order: number;
  status: string;
  updated_at?: string | null;
}
export interface AboutSectionPayload {
  title?: string;
  content?: string | null;
  cover_image?: string | null;
  sort_order?: number;
  status?: string;
}

// ---- 里程碑 ----
export interface MilestoneItem {
  id: number;
  year: string;
  title: string;
  description: string | null;
  image: string | null;
  sort_order: number;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
}
export interface MilestonePayload {
  year: string;
  title: string;
  description?: string | null;
  image?: string | null;
  sort_order?: number;
  status?: string;
}

// ---- 公司信息 ----
export interface CompanyInfo {
  id: number;
  name: string;
  logo_url: string | null;
  founded_year: number | null;
  honor_count: number | null;
  production_line_count: number | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  wechat: string | null;
  icp_no: string | null;
  intro: string | null;
  updated_at: string | null;
}
export interface CompanyInfoPayload {
  name?: string;
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

// ---- 角色 ----
export interface RoleItem {
  id: number;
  name: string;
  permissions: Record<string, string[]>;
}
export interface RolePayload {
  name: string;
  permissions?: Record<string, string[]>;
}

// ---- 管理员 ----
export interface AdminListItem {
  id: number;
  username: string;
  display_name: string | null;
  role_id: number;
  role_name: string | null;
  status: string;
  last_login_at: string | null;
  created_at: string | null;
}
export interface AdminCreatePayload {
  username: string;
  password: string;
  display_name?: string | null;
  role_id: number;
  status?: string;
}
export interface AdminUpdatePayload {
  password?: string;
  display_name?: string | null;
  role_id?: number;
  status?: string;
}

// ---- 统计 ----
export interface StatsOverview {
  products: { total: number; active: number };
  cases: { total: number; active: number };
  news: { total: number; published: number; draft: number };
  jobs: { total: number; active: number };
  messages: { total: number; new: number; handled: number };
  banners: { total: number; active: number };
  admins: number;
  series: number;
  categories: number;
  milestones: number;
}

// ---- 上传 ----
export interface UploadResult {
  url: string;
  filename: string;
}
