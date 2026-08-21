import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 本地联调：将 /api 与 /static 代理到后端 :8000，规避 CORS（见实施方案 §9）
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 必须用 127.0.0.1 而非 localhost：本机 localhost 优先解析为 IPv6 ::1，
      // 而后端只监听 127.0.0.1，会导致代理连不上上游返回 500（图片/接口 404/500）。
      "/api": "http://127.0.0.1:8000",
      "/static": "http://127.0.0.1:8000",
    },
  },
});
