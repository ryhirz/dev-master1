import axios from "axios";

// 后台统一请求客户端：baseURL=/api/admin，拦截器注入 token、处理 401 续期（M2/M4 完善）
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
    if (err?.response?.status === 401) {
      // M4：用 refresh_token 调 /api/admin/refresh；失败跳 /login
    }
    return Promise.reject(err);
  },
);

export default client;
