import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// 后台联调：/api 代理到后端 :8000（规避 CORS，见实施方案 §9）
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": "http://localhost:8000",
      "/static": "http://localhost:8000",
    },
  },
  test: {
    environment: "jsdom",
  },
});
