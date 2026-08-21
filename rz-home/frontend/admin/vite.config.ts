import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// 后台联调：/api 代理到后端 :8000（规避 CORS，见实施方案 §9）
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/static": "http://127.0.0.1:8000",
    },
  },
  // preview 模式（npm run preview）是静态服务，不会读取 server.proxy，
  // 必须单独配置 preview.proxy，否则前端 /api 请求落在 :5174 静态服务上导致登录 404。
  preview: {
    port: 5174,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/static": "http://127.0.0.1:8000",
    },
  },
  test: {
    environment: "jsdom",
  },
});
