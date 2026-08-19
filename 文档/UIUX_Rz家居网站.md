# UI/UX 文档 — Rz家居网站（前台官网 + 后台管理系统）

> 版本：v1.0
> 日期：2026-08-17
> 作者：WorkBuddy（UI/UX，基于 ui-ux-pro-max 设计智能）
> 依据：PRD v0.5（`PRD_企业家居网站.md`）、顶部导航原型（`prototype_topnav.html`）、ui-ux-pro-max 技能规范
> 技术栈：前台 React + Tailwind CSS；后台 React + Ant Design
> 文档状态：v1.0 初版，待设计/开发评审

---

## 文档说明与限制

本文档将 PRD 的需求转化为可执行的界面规范，是前端（React 官网）与后台（React + Ant Design）实现的**唯一界面依据**。

**输入与边界（已与产品方确认）**
- ✅ 采用现有源文件：`PRD_企业家居网站.md`（v0.5，品牌 Rz家居）+ `prototype_topnav.html`（仅前台顶部导航）。
- ⚠️ **限制**：缺 `prototype-frontend-v2.html` 与 `prototype-admin-v2.html`，因此第 4、5 章（前台全页、后台模块）为**基于 PRD 需求 + 本设计系统推导**的规范，而非"还原高保真原型"。顶部导航原型是唯一可视交互参考。若后续提供全页/后台原型，相关章节据实补全。
- 品牌名以现有 PRD 取 **Rz家居**（中文名）/ **Rz HOME**（英文名）/ 字母组合 **Rz** / 标语 **家居美学**。

**阅读指引**
- 第 3 章「设计系统」为全局令牌，前/后台共用。
- 第 4 章前台、第 5 章后台为逐界面规范。
- 第 8 章提供 PRD 功能点 → 界面/路由/接口的映射，便于开发拆解。
- 图标一律使用 **SVG（统一 24×24 viewBox，推荐 Lucide / Heroicons）**，**禁止 emoji 作为 UI 图标**。

---

## 1. 设计原则与约束

| 原则 | 落地要求 |
| --- | --- |
| **Accessible-first** | 正文对比度 ≥ 4.5:1；交互元素可见焦点环；所有图标按钮带 `aria-label`；表单 `label` 关联；尊重 `prefers-reduced-motion`。 |
| **一致性** | 全站统一设计令牌（色/字/间距/圆角/动效）；前/后台共用同一品牌色与字体；同类操作交互一致。 |
| **响应式优先** | 移动端首屏无横向滚动；主断点 375 / 768 / 1024 / 1440；移动端导航折叠为抽屉 + 二级手风琴。 |
| **性能预算** | 前台首屏 < 2s；图片 WebP + `srcset` + 懒加载；动效仅用 `transform/opacity`；为异步内容预留高度避免跳动。 |
| **品牌调性** | elegant + warm（温润、家居、可信赖）；克制用色，胡桃木为主、暖沙点缀、米白打底。 |
| **清晰反馈** | 按钮异步操作期间禁用防重复；错误就近提示；空/加载/异常态均有引导。 |

---

## 2. 设计系统（Design System）

### 2.1 风格定位

- **关键词**：elegant（雅致）、warm（温润）、trustworthy（可信）、calm（沉稳）。
- **气质**：以米白为底、胡桃木为骨、暖沙为饰，传递"匠心家居"的品牌温度；标题用衬线体（Noto Serif SC）提升质感，正文用无衬线体（Noto Sans SC）保证可读性。
- **避免**：高饱和撞色、拟物阴影、emoji 图标、过度动效、布局位移式 hover。

### 2.2 色彩系统

**品牌色板（前台 Tailwind 命名 + 后台 AntD 映射）**

| Token | Hex | 用途 | 对比度（on cream） | 备注 |
| --- | --- | --- | --- | --- |
| `cream` | `#FAF7F2` | 全局背景、页面底色 | — | 主背景 |
| `ink` | `#1F1B16` | 正文、标题主色 | ≥ 7:1 | 最深文字 |
| `walnut` | `#6B4F3A` | 主色（按钮、链接、激活态、Logo 底） | ~7:1 | 品牌主色，对应 AntD `primary` |
| `walnut-d` | `#4A3728` | 主色加深（hover、副标题） | ~10:1 | `walnut` 的 hover 态 |
| `sand` | `#C8A97E` | 点缀、分隔、浅底块（非文字） | on cream ~2.1:1 ❌ | **不可作文字色**；可作 ink 文字的底块 |
| `muted` | `#574F45` | 次要文字、说明、占位 | ~7.6:1 | 次要信息 |
| `line` | `#E7E0D6` | 描边、分割线、浅边框 | — | 边框/分隔 |

> 对比度说明：上表为基于 sRGB 的相对亮度估算，已满足 WCAG AA/AAA 正文要求。`sand` 在米白上仅约 2.1:1，**严禁用于正文/小字**，仅作装饰底色（其上为 `ink` 文字时约 7.7:1，可用）。交付前请用对比度检查器（如 axe / WebAIM）复核。

**语义色（建议新增，用于表单与反馈）**

| Token | Hex（建议） | 用途 |
| --- | --- | --- |
| `success` | `#2F6B4F` | 成功、已处理、启用 |
| `warning` | `#B5852A` | 警告、待处理 |
| `danger` | `#B4423A` | 错误、删除、禁用项 |
| `info` | `#6B4F3A` | 提示（复用 `walnut`） |

**暗色模式**：v1 仅做**亮色主题**（与 PRD「不做多语言/国际化」外的轻量约束一致，且家居品牌官网以亮色为主）。暗色作为 v2 可选。若启用，需重新标定对比度。

**设计令牌（CSS Variables，前后台共用）**

```css
:root {
  --color-cream: #FAF7F2;
  --color-ink: #1F1B16;
  --color-walnut: #6B4F3A;
  --color-walnut-d: #4A3728;
  --color-sand: #C8A97E;
  --color-muted: #574F45;
  --color-line: #E7E0D6;

  --color-success: #2F6B4F;
  --color-warning: #B5852A;
  --color-danger: #B4423A;

  --font-serif: "Noto Serif SC", serif;
  --font-sans: "Noto Sans SC", system-ui, sans-serif;
}
```

**前台 Tailwind 配置（对齐原型）**

```js
tailwind.config = {
  theme: {
    extend: {
      colors: { cream:'#FAF7F2', walnut:'#6B4F3A','walnut-d':'#4A3728',
                sand:'#C8A97E', ink:'#1F1B16', muted:'#574F45', line:'#E7E0D6' },
      fontFamily: { serif:['"Noto Serif SC"','serif'], sans:['"Noto Sans SC"','system-ui','sans-serif'] },
    },
  },
};
```

**后台 Ant Design 主题（覆盖主色）**

```ts
// antd v5 theme token
export const adminTheme = {
  token: { colorPrimary: '#6B4F3A', colorLink: '#6B4F3A',
           fontFamily: '"Noto Sans SC", system-ui, sans-serif',
           borderRadius: 8, colorBgLayout: '#FAF7F2' },
};
```

### 2.3 字体系统

| 角色 | 字体 | 字重 | 行高 |
| --- | --- | --- | --- |
| 标题 / 显示 | Noto Serif SC（衬线） | 600–700 | 1.2–1.3 |
| 正文 / UI | Noto Sans SC（无衬线） | 400–500 | 1.6–1.75 |
| 强调字 | Noto Sans SC | 700 | — |

**字阶（Type Scale）**

| 级别 | 字号 | 用途 |
| --- | --- | --- |
| Display | 40–48px | 首页主标题（如 "以匠心，筑理想之家"） |
| H1 | 30–32px | 页面主标题 |
| H2 | 22–24px | 区块标题 |
| H3 | 18–20px | 卡片/小组标题 |
| Body-L | 17–18px | 导语、重点正文 |
| Body | 16px | 正文（移动端最小 16px） |
| Body-S | 14px | 次要说明 |
| Caption | 12–13px | 标签、脚注 |

> 每行字符数建议 65–75（中文约 35–40 字/行），避免过长行宽。

### 2.4 间距 · 栅格 · 布局容器

- **栅格**：12 列；**基线单位 8pt**（间距取 4 的倍数：4/8/12/16/24/32/40/48/64px）。
- **布局容器**：前台内容最大宽度 `max-w-7xl`（1280px），居中，左右内边距 `px-4 sm:px-6`；后台内容区按侧边栏后剩余宽度自适应（最大 1440px）。
- **固定头部预留**：顶部导航高 `h-20`（80px）， sticky；内容区顶部留白 ≥ 24px，避免被遮挡。
- **断点**：`sm 640` / `md 768` / `lg 1024` / `xl 1280` / `2xl 1440`。前台主导航在 `lg` 以下折叠为抽屉。

### 2.5 图标规范

- 统一 **SVG、viewBox 24×24、stroke 2px、currentColor**；图标集优先 Lucide 或 Heroicons，禁止 emoji。
- 固定尺寸：`w-5 h-5`（行内）/ `w-6 h-6`（按钮内）/ `w-4 h-4`（密集列表）；装饰性大图标可放大但保持比例。
- 常用图标清单：搜索(`search`)、菜单(`menu`)、展开(`chevron-down`)、右箭头(`arrow-right`)、电话(`phone`)、邮件(`mail`)、定位(`map-pin`)、关闭(`x`)、对勾(`check`)、警告(`alert-triangle`)、用户(`user`)、编辑(`pencil`)、删除(`trash`)、筛选(`filter`)、上一页/下一页(`chevron-left/right`)。
- 所有纯图标按钮必须带 `aria-label`。

### 2.6 圆角 · 阴影 · 层级

**圆角**：`sm 6px` / `md 10px` / `lg 12px` / `xl 16px` / `full 9999px`（标签、头像）。Logo 方块用 `md`，卡片/面板用 `lg`，下拉面板用 `xl`。

**阴影（克制）**：
- `--shadow-sm`：列表/卡片静态 `0 1px 2px rgba(31,27,22,.04)`
- `--shadow-md`：悬浮/卡片 hover `0 4px 16px rgba(31,27,22,.08)`
- `--shadow-lg`：下拉/弹层 `0 12px 32px rgba(31,27,22,.12)`

**z-index 尺度（避免冲突）**：导航 `50` / 下拉浮层 `60` / 遮罩 `100` / 弹窗 `1000` / 抽屉 `1100` / Toast `1200`。

### 2.7 动效规范

- **时长**：微交互 150–200ms；面板/抽屉 200–250ms；页面级过渡 250–300ms。
- **缓动**：`cubic-bezier(0.4, 0, 0.2, 1)`（标准）。
- **属性**：仅 `transform` / `opacity`，禁止 `width/height/top/left` 触发重排。
- **hover 不位移**：颜色/透明度/阴影变化，**禁止 scale 导致布局跳动**；如需放大用 `scale` 但需 `transform-origin` 居中且不影响兄弟元素。
- **减少动画**：`@media (prefers-reduced-motion: reduce)` 下关闭过渡与动画。

### 2.8 基础组件库（规范）

**按钮 Button**
| 变体 | 样式 | 用途 |
| --- | --- | --- |
| Primary | `bg-walnut text-cream`，hover `bg-walnut-d` | 主操作（提交、在线留言） |
| Secondary | `border border-walnut text-walnut`，hover `bg-line/60` | 次操作（取消、返回） |
| Ghost | `text-walnut`，hover `bg-line/60` | 低强调（文本按钮） |
| Danger | `bg-danger text-white` | 删除/危险（后台） |

- 尺寸：`sm h-9` / `md h-11`（≥44px 触达）/ `lg h-12`；圆角 `md`。
- 状态：default / hover（变色）/ active（同 hover 不缩放）/ disabled（`opacity-50 cursor-not-allowed`）/ loading（禁用 + spinner，防重复提交）。
- 所有可点击元素加 `cursor-pointer` 与键盘 `:focus-visible` 焦点环（`ring-2 ring-walnut/40`）。

**输入框 Input / 文本域**
- `label`（带 `for`），必填项 `*`；边框 `border-line`，聚焦 `border-walnut ring-walnut/30`；高 `h-11`；圆角 `md`。
- 错误态：边框 `danger` + 下方就近红字说明；`aria-invalid="true"` + `aria-describedby` 关联错误文本。
- 占位符用 `muted`。

**下拉 Select / 级联**
- 与 Input 同高同边框；自定义下拉面板复用 `shadow-lg rounded-lg`；选项 hover `bg-cream`。

**卡片 Card**（产品/案例/新闻/职位）
- `bg-white rounded-lg border border-line shadow-sm`，内边距 16–20px；可点击卡片 hover `shadow-md` + 标题变色，**不位移**。
- 封面图统一比例（产品 4:3 / 案例 16:9 / 新闻 3:2），`object-cover`。

**标签 Tag / Badge**
- `rounded-full px-2.5 py-0.5 text-xs`；中性（`bg-line text-muted`）/ 品牌（`bg-walnut/10 text-walnut`）/ 语义（success/warning/danger 浅底）。

**分页 Pagination**
- 页码按钮 ≥ 40×40；当前 `bg-walnut text-cream`；上一页/下一页用 `chevron` 图标按钮。

**弹窗 Modal / 对话框 Dialog**
- 遮罩 `bg-black/40`；面板 `bg-white rounded-lg max-w-lg z-[1000]`；标题 + 正文 + 底部操作；支持 `Esc` 关闭、点击遮罩关闭、焦点陷阱、`aria-modal="true"`；进入 200ms `opacity+translateY`。

**抽屉 Drawer（后台详情/表单）**
- 右侧滑入 `translate-x`，`z-[1100]`；遮罩 `bg-black/40`；进入 250ms `transform`；关闭按钮 + `Esc`。

**轻提示 Toast**
- 顶部居中或右下，`z-[1200]`；3s 自动消失；success/warning/danger 配对应语义色左条 + 图标。

**表格 Table（后台）**
- Ant Design Table 主题化；行高 `h-12`；hover 行 `bg-cream`； sticky 表头；排序/筛选图标复用 2.5 图标；空数据用空状态组件。

**面包屑 Breadcrumb**
- `muted` 分隔 `›`；当前项 `walnut`；点击可跳转上级。

**空 / 加载态**
- 空状态：居中 SVG 插画（品牌色描边）+ 引导文案 + 主操作按钮。
- 加载：骨架屏（cream/sand 微闪）或 spinner；为异步内容预留高度，避免跳动。

---

## 3. 前台官网 UI 规范（逐页面）

> 路由约定：`/`（首页）、`/products`、`/products/:id`、`/cases`、`/cases/:id`、`/news`、`/news/:id`、`/jobs`、`/jobs/:id`、`/about`、`/about/history`、`/about/brand`、`/about/contact`。

### 3.1 全局框架

**顶部导航（已落地于 prototype_topnav.html，严格对齐 PRD 3.1）**
- 结构：Logo（Rz 字标方块 + "Rz家居"）+ 主导航（5 项）+ 右侧（搜索图标、在线留言 CTA、移动汉堡）。
- 主色条：`sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-line`，高 `h-20`。
- 桌面（`lg+`）：主导航 hover / 键盘 `focus-within` 弹出二级面板（`bg-white rounded-xl shadow-lg ring-1 ring-line`，200ms 淡入 + 上移 6px→0），面板含次级说明文字（如"系列/空间"）。
- 移动（`<lg`）：汉堡开合抽屉；二级为手风琴（`aria-expanded` 控制）；"在线留言"在抽屉底部全宽按钮。
- 无障碍：`aria-label`/`aria-haspopup`/`aria-expanded`/`aria-current` 齐备；Tab 顺序与视觉一致；键盘可聚焦展开。
- 当前页高亮：`aria-current="page"` 或 `text-walnut` 激活态。

**页脚 Footer**
- 米白底 + `line` 顶边；三栏：① 品牌（Rz HOME · 家居美学 + 简介）② 导航快捷（5 主导航 + 二级）③ 联系（电话/邮箱/地址/微信/ICP 备案占位）。
- 底部版权行（© 2026 Rz家居 · 备案号占位 · 隐私政策链接 P1）。

**布局容器 / 面包屑**
- 各页内容 `max-w-7xl mx-auto px-4 sm:px-6`，上下留白 `py-12 lg:py-16`。
- 内页带面包屑（首页 › 当前），与导航激活态联动。

### 3.2 首页 `/`

- **Hero + 轮播 Banner**：全宽轮播（后台 `banner` 驱动），每张含图 + 标语 + CTA；自动轮播 + 指示点 + 左右切换（图标按钮，键盘可达）。
- **品牌一句话定位**：`Rz HOME · 家居美学` + Display 标题（如"以匠心，筑理想之家"）+ 副文案。
- **企业实力数据**：来自 `company_info`（建厂年份/荣誉数/生产线数），4 项指标卡片；**未配置则该区块不渲染、不报错**。
- **推荐产品**：后台 `is_recommended` 产品卡片横滑/网格，点击进详情。
- **最新案例 / 最新新闻**：各取最新 N 条卡片；"查看全部"入口。
- **招聘入口 CTA**：温润色块 + "加入我们"按钮 → `/jobs`。
- 响应式：桌面多列网格；移动单列；轮播高度自适应。

### 3.3 产品 → 产品中心 `/products` `/products/:id`

- **系列列表**（首屏可选）：系列卡片（封面 + 名称 + 产品数），点击进该系列筛选。
- **产品列表**：左侧/顶部筛选（系列 `series_id`、空间分类 `category_id`、关键词）+ 排序 + 分页（≥40px 页码）。卡片含封面、名称、型号、`price` 展示参考价（若有）。
- **产品详情**：主图 + 图集缩略图切换；名称、型号、简介；规格参数（JSON 渲染为定义列表）；所属系列/分类标签；相关推荐。
- **状态**：`status=hidden` 产品列表不展示、详情返回 404/已下架提示。

### 3.4 产品 → 新案例展示 `/cases` `/cases/:id`

- **列表**：分类筛选（住宅/工程/商业）+ 分页；卡片含封面、标题、分类标签；`is_new` 标"新"角标并优先。
- **详情**：图集（主图 + 缩略图）、描述（富文本）、项目信息（分类/年份等）；仅 `active` 可见。

### 3.5 新闻 → 企业新闻 / 行业资讯 `/news` `/news/:id`

- 顶部 Tab（企业新闻 `category=company` / 行业资讯 `category=industry`），切换即筛选。
- **列表**：封面 + 标题 + 日期 + 摘要；置顶项带标记。
- **详情**：正文富文本、发布时间、分类标签；仅 `published` 可见，草稿不展示。

### 3.6 招聘入口 → 社会招聘 / 校园招聘 `/jobs` `/jobs/:id`

- 顶部 Tab（社会 `type=social` / 校园 `type=campus`）。
- **列表**：职位卡片（标题、部门、城市、薪资可选、类型标签）+ 分页。
- **详情**：职责（富文本）、任职要求、招聘人数；**「投递意向」按钮**（Primary）。
- **投递意向表单**（弹窗/内嵌）：姓名*、电话*、邮箱、内容；提交 → `POST /api/inquiries`（`type=job_application`, `job_id`）；成功后 Toast + 进入后台「应聘留言」。

### 3.7 关于我们 → 四子页

- **关于Rz `/about`**：公司简介（富文本）+ 企业实力数据（同首页，复用 `company_info`）。
- **发展历程 `/about/history`**：竖向/横向时间轴（`milestone` 驱动，年份节点 + 标题 + 描述 + 可选图）。
- **品牌介绍 `/about/brand`**：品牌理念/工艺（人体工程学/原创设计/智能生产线/售后），`about_section[brand]` 驱动。
- **联系我们 `/about/contact`**：公司信息（地址/电话/邮箱/微信/地图占位）+ **在线留言表单**（姓名*、电话*、邮箱、内容*）→ `type=contact`。
- 四页内容均由后台「关于我们配置」驱动；未配置显示默认占位文案，不报错。

### 3.8 全局状态

- **加载**：骨架屏（列表/详情），轮播先占位。
- **空**：如"暂无产品/案例/新闻/职位"，空状态组件 + 引导。
- **错误/网络**：友好提示 + 重试按钮；404 页（品牌化）。
- **表单提交**：loading 禁用按钮 + 成功/失败 Toast；校验错误就近红字。

---

## 4. 后台管理系统 UI 规范

> 技术：React + Ant Design（主题化见 2.2）。布局：左侧固定侧边栏 + 顶部栏 + 内容区。

### 4.1 布局框架

- **登录页**：居中卡片（品牌 Logo + Rz家居），账号/密码输入，记住登录（RefreshToken）；错误就近提示；登录失败限频。
- **主框架**：左 `侧边栏`（Logo + 菜单树，折叠态图标）+ 顶栏（面包屑、当前管理员、退出）；内容区 `max-w-[1440px] mx-auto p-6`。
- **菜单权限**：按角色过滤（超级管理员全显；内容编辑隐藏招聘/留言/系统；客服/HR 仅显示留言/招聘/部分概览）。
- **z-index**：侧边栏/顶栏 50；弹层 1000；抽屉 1100；Toast 1200。

### 4.2 控制台（数据概览）

- 卡片网格：产品/案例/新闻/职位总数；联系留言、应聘留言数量与近 30 天趋势（轻量折线/柱状，用可访问调色板）；内容更新频率。
- 快捷入口：待处理留言数（红点）、草稿内容数。

### 4.3 内容管理

- **通用列表页**：表格（AntD）+ 筛选条（状态/分类/关键词）+ 分页 + 批量操作（上下架/删除）+「新增」按钮。
- **通用表单页/抽屉**：左侧字段、右侧预览（可选）；富文本用 Tiptap/React-Quill；图片字段走 `/api/admin/upload` 上传返回 URL 后显示缩略图；必填校验。
- **模块对应**：
  - 产品系列（5.2）、产品分类（5.3）、产品（5.4，含规格 JSON、推荐开关、图集）、案例（5.5，分类枚举+新标记）、新闻（5.6，分类 company/industry+置顶+草稿/发布）、关于我们配置（5.12：公司信息 / about_section / milestone 三个子表单）。

### 4.4 招聘管理 · 职位（5.7）

- 列表（按 type 社会/校园筛选、状态上下架）；表单：类型、标题、部门、城市、薪资、职责、要求、人数、发布时间。

### 4.5 互动管理 · 留言（5.8）

- 列表：按 `type`（联系/应聘）、`status`（未处理/已处理/忽略）筛选；应聘留言显示关联职位（`ref_id → job 标题`）。
- 操作：查看详情（抽屉）、回复（记录内容+时间）、标记状态；支持导出（P1）。

### 4.6 展示管理 · 轮播（5.9）

- 列表（排序、状态、生效时间）；表单：标题、图片（上传）、跳转链接、排序、生效时间区间；仅"生效且未过期"前台展示。

### 4.7 系统管理（5.10）

- **管理员**：列表（用户名、姓名、角色、状态、最后登录）；新增（用户名/姓名/角色/初始密码）、启用禁用、重置密码。
- **角色与权限**：三角色预置；权限为模块级增删改查开关（P1 细化按钮级）；变更需确认。

### 4.8 数据统计（5.11）

- 概览页（同 4.2，可独立成页）；数据实时聚合，无独立统计表。

### 4.9 通用交互模式（后台）

- **列表/筛选/分页**：筛选条件变更即刷新；分页 ≥40px；批量操作前二次确认弹窗。
- **表单**：必填 `*`、即时校验、错误就近、提交 loading、成功 Toast 并关闭抽屉/返回列表。
- **详情**：抽屉右侧滑入，展示只读字段 + 操作按钮（编辑/删除）。
- **删除/下架**：`Popconfirm` 或 Modal 确认，危险色提示不可逆。

### 4.10 角色权限界面差异

| 角色 | 可见菜单 | 操作边界 |
| --- | --- | --- |
| 超级管理员 | 全部 | 含账号、角色、数据统计 |
| 内容编辑 | 控制台、内容管理（系列/分类/产品/案例/新闻/关于我们配置）、轮播 | 展示型内容 CRUD；**无**招聘/留言/系统 |
| 客服/HR | 控制台（概览）、招聘管理、互动管理（留言） | 线索型内容（留言+招聘）；**无**其他内容/系统 |

> 边界原则：内容编辑管"展示型"，客服/HR 管"线索型"，互不越权（与 PRD 5.1 一致）。无权限访问时提示并跳转。

---

## 5. 交互与无障碍规范（全局）

| 项目 | 要求 |
| --- | --- |
| 焦点环 | 所有可聚焦元素 `:focus-visible` 显示 `ring-2 ring-walnut/40`；移除默认 outline 时必须有替代。 |
| 键盘可达 | Tab 顺序 = 视觉顺序；下拉/抽屉/弹窗可 Tab 进入、Esc 退出、焦点陷阱。 |
| 对比度 | 正文 ≥ 4.5:1；大字号/UI 元素 ≥ 3:1；`sand` 不用于文字。 |
| 触达尺寸 | 可点击目标 ≥ 44×44px（按钮 `h-11`、页码 40px 需补间距至 44）。 |
| 图片 | 所有 `<img>` 有有意义 `alt`；装饰图 `alt=""` + `aria-hidden`。 |
| 表单 | `label` for 关联；错误 `aria-invalid` + `aria-describedby`；必填 `*` 并有文字说明。 |
| 颜色非唯一 | 状态不只靠颜色（如错误同时有图标 + 文字）。 |
| 减少动画 | 尊重 `prefers-reduced-motion`，关闭非必要过渡。 |
| 语义化 | 用 `header/nav/main/footer/section/article`；列表用 `ul/li`；图标按钮 `aria-label`。 |

---

## 6. 组件状态与异常

| 状态 | 表现 |
| --- | --- |
| Loading | 按钮 spinner + 禁用；列表/详情骨架屏；轮播占位；预留高度防跳动。 |
| Empty | 品牌化插画 + "暂无内容" + 主操作（如"去新增"）。 |
| Error | 行内红字（表单）/ 区块友好提示 + 重试（网络）/ 404 品牌页。 |
| Disabled | `opacity-50 cursor-not-allowed`，不可聚焦提交。 |
| Success | 绿色 Toast + 图标；表单关闭并返回。 |
| 网络异常 | 全局拦截：401 跳登录（RefreshToken 失效）；5xx 友好提示。 |

---

## 7. PRD → 界面映射

### 7.1 前台

| PRD 功能 | 路由 | 主要组件 | 接口 |
| --- | --- | --- | --- |
| 首页（4.1） | `/` | 轮播、实力数据、推荐产品、案例/新闻列表、招聘 CTA | `/api/home/overview`、`/api/banners` |
| 产品中心（4.2） | `/products` `/products/:id` | 系列卡、筛选条、产品卡、详情 | `/api/series`、`/api/products`(+id) |
| 新案例（4.3） | `/cases` `/cases/:id` | 分类筛选、案例卡、详情 | `/api/cases`(+id) |
| 新闻（4.4） | `/news` `/news/:id` | Tab、新闻卡、详情 | `/api/news`(+id) |
| 招聘（4.5） | `/jobs` `/jobs/:id` | Tab、职位卡、详情、投递表单 | `/api/jobs`(+id)、`POST /api/inquiries` |
| 关于Rz（4.6） | `/about` | 简介 + 实力数据 | `/api/about/overview` |
| 发展历程（4.6） | `/about/history` | 时间轴 | `/api/about/history` |
| 品牌介绍（4.6） | `/about/brand` | 图文 | `/api/about/brand` |
| 联系我们（4.6） | `/about/contact` | 公司信息 + 留言表单 | `/api/contact/info`、`POST /api/inquiries` |

### 7.2 后台

| PRD 模块 | 路由（建议） | 主要界面 | 接口 |
| --- | --- | --- | --- |
| 登录（5.1） | `/login` | 登录表单 | `/api/admin/login`、`/refresh`、`/logout` |
| 控制台（5.11） | `/dashboard` | 数据概览 | `/api/admin/stats/overview` |
| 系列/分类/产品（5.2–5.4） | `/content/series`、`/content/categories`、`/content/products` | 列表 + 表单抽屉 | `/api/admin/series`、`/categories`、`/products` |
| 案例（5.5） | `/content/cases` | 列表 + 表单 | `/api/admin/cases` |
| 新闻（5.6） | `/content/news` | 列表 + 表单 | `/api/admin/news` |
| 关于我们配置（5.12） | `/content/about` | 三子表单（公司信息/区块/历程） | `/company-info`、`/about-sections`、`/milestones` |
| 招聘（5.7） | `/recruit/jobs` | 列表 + 表单 | `/api/admin/jobs` |
| 留言（5.8） | `/interaction/messages` | 列表 + 详情抽屉 + 回复 | `/api/admin/messages`(+id) |
| 轮播（5.9） | `/display/banners` | 列表 + 表单 | `/api/admin/banners` |
| 管理员/角色（5.10） | `/system/admins`、`/system/roles` | 列表 + 表单 + 权限开关 | `/api/admin/admins`、`/roles` |
| 上传 | — | 图片上传组件 | `POST /api/admin/upload` |

---

## 8. 待确认与开放问题

1. **品牌内容素材**：关于Rz/品牌介绍/发展历程文案与图待业务方提供（PRD 风险项）；当前用占位。
2. **高保真原型缺失**：前台全页与后台原型未提供，第 3、4 章为需求推导式规范；如后续提供，据实补全并可能调整组件细节。
3. **暗色模式**：v1 仅亮色；是否纳入 v2 待定。
4. **搜索功能**：原型含搜索图标入口，PRD 未明确搜索范围（全站/产品）；需确认搜索是否 v1 实现及范围。
5. **语义色与图标集**：本文建议的 success/warning/danger 与 Lucide 图标为默认推荐，落地前由设计确认。
6. **隐私政策/验证码**：PRD 标 P1；具体文案与验证码服务商待定。
7. **品牌名**：以 Rz家居 写入；若最终定名 TP全屋家居，需提供对应 PRD 并全局替换。

---

> 本 UI/UX 文档仅描述界面规范与设计系统，**不包含实现代码**。设计与开发应据此拆解任务并评审技术细节。
