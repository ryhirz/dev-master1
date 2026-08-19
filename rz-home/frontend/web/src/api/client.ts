import axios from "axios";

// 统一请求客户端：baseURL=/api，拦截器注入 token、处理 401 续期（M3 完善）
const client = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("rz_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    // M3：401 时以 refresh_token 调 /api/admin/refresh 换新并重试；失败跳登录
    if (err?.response?.status === 401) {
      // noop placeholder
    }
    return Promise.reject(err);
  },
);

export default client;
