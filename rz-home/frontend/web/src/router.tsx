// 前台导航配置（5 主导航 + 关于我们二级），驱动 MainLayout 菜单与路由（对齐 prototype §3.1）
export interface NavItem {
  path: string;
  label: string;
  children?: NavItem[];
}

export const NAV: NavItem[] = [
  { path: "/", label: "首页" },
  {
    path: "/products",
    label: "产品",
    children: [
      { path: "/products", label: "产品中心" },
      { path: "/cases", label: "新案例展示" },
    ],
  },
  {
    path: "/news",
    label: "新闻动态",
    children: [
      { path: "/news?cat=company", label: "企业新闻" },
      { path: "/news?cat=industry", label: "行业资讯" },
    ],
  },
  {
    path: "/jobs",
    label: "招聘",
    children: [
      { path: "/jobs?type=social", label: "社会招聘" },
      { path: "/jobs?type=campus", label: "校园招聘" },
    ],
  },
  {
    path: "/about",
    label: "关于我们",
    children: [
      { path: "/about", label: "关于Rz" },
      { path: "/about/history", label: "发展历程" },
      { path: "/about/brand", label: "品牌介绍" },
      { path: "/about/contact", label: "联系我们" },
    ],
  },
];
