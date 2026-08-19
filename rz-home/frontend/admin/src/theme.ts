import type { ThemeConfig } from "antd";

// AntD 主题（对齐 UI/UX §2.2 / §4.10）：主色胡桃棕、圆角 8、布局米色、Noto Sans SC
export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: "#6B4F3A",
    borderRadius: 8,
    colorBgLayout: "#FAF7F2",
    fontFamily: '"Noto Sans SC", system-ui, sans-serif',
    colorLink: "#6B4F3A",
  },
  components: {
    Layout: {
      siderBg: "#FFFFFF",
      headerBg: "#FFFFFF",
    },
    Menu: {
      itemSelectedBg: "#F1E9E0",
      itemSelectedColor: "#6B4F3A",
    },
  },
};

// 三角色（与后端 role.name 对齐，权限矩阵见《开发技术文档》§4.7.D）
export type AdminRole = "super_admin" | "editor" | "cs_hr";
