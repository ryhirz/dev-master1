import type { ThemeConfig } from "antd";

// AntD 主题（M6 科技感：主色荧光蓝、圆角 8、浅色布局保持实用、Noto Sans SC）
export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: "#00B3FF",
    borderRadius: 8,
    colorBgLayout: "#F2F8FF",
    fontFamily: '"Noto Sans SC", system-ui, sans-serif',
    colorLink: "#0084C4",
  },
  components: {
    Layout: {
      siderBg: "#FFFFFF",
      headerBg: "#FFFFFF",
    },
    Menu: {
      itemSelectedBg: "#E1F4FF",
      itemSelectedColor: "#0084C4",
    },
  },
};

// 三角色（与后端 role.name 对齐，权限矩阵见《开发技术文档》§4.7.D）
export type AdminRole = "super_admin" | "editor" | "cs_hr";
