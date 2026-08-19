import type { AdminRole } from "./theme";

// 后台菜单/路由配置：roles 为空表示全部角色可见；权限矩阵见《开发技术文档》§4.7.D
export interface AdminNavItem {
  path: string;
  label: string;
  roles?: AdminRole[];
}

export const ADMIN_NAV: AdminNavItem[] = [
  { path: "/dashboard", label: "控制台" },
  { path: "/content/series", label: "产品系列", roles: ["super_admin", "editor"] },
  { path: "/content/categories", label: "产品分类", roles: ["super_admin", "editor"] },
  { path: "/content/products", label: "产品", roles: ["super_admin", "editor"] },
  { path: "/content/cases", label: "案例", roles: ["super_admin", "editor"] },
  { path: "/content/news", label: "新闻", roles: ["super_admin", "editor"] },
  { path: "/content/about", label: "关于我们", roles: ["super_admin", "editor"] },
  { path: "/recruit/jobs", label: "招聘管理", roles: ["super_admin", "cs_hr"] },
  { path: "/interaction/messages", label: "留言管理", roles: ["super_admin", "cs_hr"] },
  { path: "/display/banners", label: "轮播管理", roles: ["super_admin", "editor"] },
  { path: "/system/admins", label: "管理员", roles: ["super_admin"] },
  { path: "/system/roles", label: "角色权限", roles: ["super_admin"] },
  { path: "/stats", label: "数据统计" },
];
