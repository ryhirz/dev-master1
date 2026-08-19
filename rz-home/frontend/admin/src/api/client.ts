import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "../types";

// 后台统一请求客户端：baseURL=/api（Vite 代理 → :8000）
// 请求拦截：注入 Bearer rz_access_token
// 响应拦截：401 时用 rz_refresh_token 调 /admin/refresh 续期并重放；续期失败清 token 跳 /login
const client = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

const ACCESS_KEY = "rz_access_token";
const REFRESH_KEY = "rz_refresh_token";

export const tokenStorage = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(data: { access_token: string; refresh_token?: string }) {
    localStorage.setItem(ACCESS_KEY, data.access_token);
    if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

client.interceptors.request.use((config) => {
  const token = tokenStorage.access;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 防止并发刷新风暴：共享同一个 refresh 请求
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const rt = tokenStorage.refresh;
  if (!rt) return null;
  try {
    const { data } = await axios.post<ApiEnvelope<{ access_token: string }>>(
      "/api/admin/refresh",
      { refresh_token: rt },
    );
    if (data.code !== 0 || !data.data?.access_token) return null;
    tokenStorage.set({ access_token: data.data.access_token });
    return data.data.access_token;
  } catch {
    return null;
  }
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

client.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const config = err.config as RetriableConfig | undefined;
    const isLoginCall = config?.url?.includes("/admin/login") || config?.url?.includes("/admin/refresh");
    if (err.response?.status === 401 && config && !config._retry && !isLoginCall) {
      config._retry = true;
      refreshing = refreshing ?? doRefresh();
      try {
        const token = await refreshing;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return client(config);
        }
      } catch {
        /* fallthrough */
      } finally {
        refreshing = null;
      }
      tokenStorage.clear();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

// 解包响应信封：{ code, message, data }；code!==0 视为业务错误抛出
export async function unwrap<T>(p: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await p;
  const env = res.data;
  if (env.code !== 0) {
    throw new Error(env.message || "请求失败");
  }
  return env.data;
}

// 统一错误信息提取（用于 Toast/表单错误展示）
export function errMsg(e: unknown, fallback = "操作失败"): string {
  if (axios.isAxiosError(e)) {
    const detail = (e.response?.data as { detail?: string; message?: string }) ?? {};
    return detail.detail || detail.message || `请求失败(${e.response?.status ?? "网络错误"})`;
  }
  return e instanceof Error ? e.message : fallback;
}

export default client;
