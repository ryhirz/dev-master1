# M3 交付总结 — 前台官网页面（frontend/web）

> 阶段：M3（前台官网页面实现）
> 技术栈：Vite + React 18 + TypeScript + React Router 6 + Tailwind CSS 3 + Zustand + Axios
> 状态：**✅ 已完成**（typecheck 通过 / 生产构建通过 / 后端联调契约核对通过）

---

## 1. 阶段范围与验收

| 验收项 | 要求 | 结果 |
|---|---|---|
| 设计令牌对齐 UI/UX §2.2 | 色值/字体/圆角严格一致 | ✅ |
| 12 路由 + 404 页面 | 首页/产品/案例/新闻/招聘/关于四子页 | ✅ 14 个页面文件 |
| 16 个公开接口对接 | 复用 M2 已冻结契约 | ✅ 逐接口核对 |
| 统一响应信封解包 | `{code,message,data,request_id}` | ✅ `unwrap<T>` |
| 占位素材策略 | 无图胡桃木渐变占位 + Rz 字标 | ✅ |
| 搜索 v1 仅 UI 占位 | 回车跳 `/products?keyword=` | ✅（确认项） |
| 留言/求职限频 | 复用 M2 内存级 10/min | ✅ 后端已落地 |
| 无障碍基础 | focus-visible / aria / reduced-motion | ✅ |
| 类型检查 | `tsc --noEmit` | ✅ 0 错误 |
| 生产构建 | `vite build` | ✅ 113 模块 / dist 产出 |

---

## 2. 交付文件清单

```
frontend/web/
├── index.html                      # 接入 Noto Serif SC / Noto Sans SC（Google Fonts）
├── tailwind.config.js              # 色板精确对齐 UI/UX §2.2 + shadow/maxWidth 扩展
├── vite.config.ts                  # /api、/static → http://localhost:8000 代理
└── src/
    ├── index.css                   # CSS 变量、焦点环、prefers-reduced-motion、.prose-rz
    ├── theme.ts                    # BRAND 常量、PLACEHOLDER_GRADIENT（胡桃木渐变）
    ├── types.ts                    # 全部前端实体类型（对齐后端 schema）
    ├── api/
    │   ├── client.ts               # Axios 实例（baseURL=/api，token 注入，401 占位）
    │   └── index.ts                # 类型化 API 客户端 + unwrap<T> 解包
    ├── router.tsx                  # 5 主导航 + 二级导航配置
    ├── hooks/useApi.ts             # loading/error/自动取消
    ├── components/
    │   ├── Icons.tsx               # SVG 图标集（禁用 emoji）
    │   ├── ui.tsx                  # Button/Tag/ImagePlaceholder/Skeleton/Empty/Pagination/Tabs/Breadcrumb/SectionHeading/PageContainer
    │   ├── Modal.tsx               # Esc/遮罩关闭、body 锁滚、aria-modal
    │   ├── Field.tsx               # Field/TextInput/TextArea/Select（label 关联、错误就近）
    │   ├── Toast.ts                # 函数式 Toast（success/error/warning）
    │   └── cards.tsx               # ProductCard/CaseCard/NewsCard/JobCard
    ├── layouts/MainLayout.tsx      # Logo / 桌面下拉 / 移动抽屉手风琴 / 搜索 / 三栏页脚
    └── pages/                      # 14 个页面
        ├── Home.tsx                # Hero 轮播 + 品牌定位 + 实力 + 推荐产品 + 最新案例/新闻 + 招聘 CTA
        ├── Products.tsx            # 系列/空间分类/关键词 筛选 + 分页
        ├── ProductDetail.tsx       # 图集缩略图切换 + 规格 dl + 相关推荐 + 咨询
        ├── Cases.tsx               # 分类 Tab（全部/住宅/工程/商业）+ is_new 优先
        ├── CaseDetail.tsx          # 图集 + 描述 + 项目信息 dl
        ├── News.tsx                # Tab（全部/企业新闻/行业资讯）
        ├── NewsDetail.tsx          # 富文本 + 标签 + 时间
        ├── Jobs.tsx                # Tab（全部/社会/校园）
        ├── JobDetail.tsx           # 职责/要求 + 投递意向 Modal + 校验 + Toast
        ├── About.tsx               # 公司简介 + 实力数据 + 子页入口
        ├── AboutHistory.tsx        # 竖向时间轴
        ├── AboutBrand.tsx          # 品牌理念 + 四特性卡片
        ├── AboutContact.tsx        # 公司信息 + 在线留言表单 + 校验 + Toast
        └── NotFound.tsx            # 品牌化 404
```

---

## 3. 设计系统落地（UI/UX §2.2 精确值）

| Token | 值 | 用途 |
|---|---|---|
| cream | `#FAF7F2` | 页面背景 |
| ink | `#1F1B16` | 主文字 |
| walnut | `#6B4F3A` | 主题/强调 |
| walnut-d | `#4A3728` | 深胡桃（hover/footer） |
| sand | `#C8A97E` | 次级强调 |
| muted | `#574F45` | 次要文字 |
| line | `#E7E0D6` | 分隔线 |
| success / warning / danger | `#2E7D5B` / `#C2701B` / `#B23A3A` | 语义色（≤10%） |

字体：`Noto Serif SC`（标题）/ `Noto Sans SC`（正文）。圆角：卡片 `12px`、按钮 `8px`、无阴影/细边分层。

---

## 4. 路由 ↔ 页面映射

| 路径 | 页面 | 数据来源 |
|---|---|---|
| `/` | Home | `homeOverview` |
| `/products` | Products | `products`（筛选+分页） |
| `/products/:id` | ProductDetail | `product` |
| `/cases` | Cases | `cases` |
| `/cases/:id` | CaseDetail | `case` |
| `/news` | News | `news` |
| `/news/:id` | NewsDetail | `newsItem` |
| `/jobs` | Jobs | `jobs` |
| `/jobs/:id` | JobDetail | `job` + `inquiry` |
| `/about` | About | `aboutOverview` |
| `/about/history` | AboutHistory | `history` |
| `/about/brand` | AboutBrand | `brand` |
| `/about/contact` | AboutContact | `contactInfo` + `inquiry` |
| `*` | NotFound | — |

---

## 5. API 对接映射（前端 api ↔ 后端 M2 路由）

后端 `public.router` 前缀为 `/api`，前端 `client.baseURL=/api` → 实际请求 `/api/<route>`，由 Vite 代理转发至 `:8000`，契约一致（已核对）。

| 前端方法 | 请求 | 后端路由 | 返回 data 形状 |
|---|---|---|---|
| `homeOverview` | GET `/home/overview` | `/api/home/overview` | `{banners, recommended_products, company, latest_cases, latest_news, job_open_count}` |
| `series` | GET `/series` | `/api/series` | `Paged<ProductSeries>` |
| `products(q)` | GET `/products` | `/api/products` | `Paged<Product>` |
| `product(id)` | GET `/products/{id}` | `/api/products/{id}` | `{product, related}` |
| `cases(q)` | GET `/cases` | `/api/cases` | `Paged<CaseItem>` |
| `case(id)` | GET `/cases/{id}` | `/api/cases/{id}` | `CaseItem` |
| `news(q)` | GET `/news` | `/api/news` | `Paged<NewsItem>` |
| `newsItem(id)` | GET `/news/{id}` | `/api/news/{id}` | `NewsItem` |
| `aboutOverview` | GET `/about/overview` | `/api/about/overview` | `{company, overview}` |
| `history` | GET `/about/history` | `/api/about/history` | `Milestone[]` |
| `brand` | GET `/about/brand` | `/api/about/brand` | `AboutSection` |
| `contactInfo` | GET `/contact/info` | `/api/contact/info` | `Partial<CompanyInfo>`（6 字段子集） |
| `jobs(q)` | GET `/jobs` | `/api/jobs` | `Paged<Job>` |
| `job(id)` | GET `/jobs/{id}` | `/api/jobs/{id}` | `Job` |
| `banners` | GET `/banners` | `/api/banners` | `Banner[]` |
| `inquiry(p)` | POST `/inquiries` | `/api/inquiries` | `InquiryOut{id,type}`（信封 message=提交成功） |

> 前端 `unwrap<T>` 从 `res.data.data` 取出业务数据；`inquiry` 直接返回整包信封，页面以 `try/catch` 处理 HTTP 错误（axios 非 2xx 抛错），成功即 Toast。

---

## 6. 关键实现说明

- **占位素材**：`images` 为空或 `cover_image` 缺失时，统一渲染 `PLACEHOLDER_GRADIENT` 胡桃木渐变 + `Rz` 字标，不报错、不断图。
- **空间分类筛选**：后端 `/products` 仅支持 `category_id`，前端通过 `products(page_size=100)` 派生 `category_id → name` 映射生成下拉，无独立空间接口依赖。
- **搜索 v1**：维持实施方案确认项 —— 仅 UI 占位，搜索框回车跳 `/products?keyword=`（后端已支持 `keyword` 模糊匹配 name/summary）。
- **留言限频**：复用 M2 内存级 10 次/分钟（按 IP），`/inquiries` 超频返回 429 + 文案，前端 catch 后 Toast 提示。
- **公司信息缺省**：`company` 为 `null` 或未配置 `overview/brand` 时，显示合理默认文案，不抛异常。

---

## 7. 本地联调启动说明

### 7.1 后端（:8000）
```bash
cd rz-home/backend
./venv/Scripts/activate            # 或 venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
uvicorn app.main:app --reload --port 8000
# 开发环境自动 init_db() + seed()
# 验证：GET http://localhost:8000/api/home/overview → 信封 {code:0,data:{...}}
```

### 7.2 前台（:5173）
```bash
cd rz-home/frontend/web
npm install
npm run dev                        # Vite，默认 http://localhost:5173
# /api、/static 经 vite.config.ts 代理至 :8000，无需手动配置 CORS
```

### 7.3 联调验证清单
1. 后端 `:8000` 启动，`/api/home/overview` 返回 `code:0`。
2. 前台 `:5173` 打开首页，Hero 轮播、推荐产品、最新案例/新闻均渲染（无图走占位）。
3. 系列产品筛选 + 分页可用；产品详情图集/规格/相关推荐正常。
4. 案例/新闻/招聘 Tab 切换 + 分页正常。
5. 关于四子页（简介/历程/品牌/联系）均可访问。
6. 联系页留言、职位投递提交后 Toast 成功（可在后端 DB `messages` 表核验）。

---

## 8. 假设与偏差（对齐 UI/UX §8 待确认项）

- 品牌主视觉素材（大图/Banner）由占位渐变兜底，待真实素材入库后由 `banners` / `images` 字段自动替换。
- 搜索维持 v1 仅 UI 占位（确认项），后续版本接入独立搜索接口。
- 暗色主题标记为 v2，本阶段仅实现浅色（cream 底）。

---

## 9. 下一步

- **M4**：后台管理系统（frontend/admin，Ant Design 5，14 路由：登录/仪表盘/产品/案例/新闻/招聘/留言/公司信息/关于内容/轮播/账号/系统设置），对接 M2 管理接口（auth + CRUD + 上传 + stats）。
- 待 M3 联调在浏览器（Edge）实际验证后，再进入 M4。

---

## 10. 联调修复记录（M3 端到端验证中发现并修复）

M3 启动真实后端（ENV=dev，自动建库 + 种子）做端到端联调时，发现并修复了 M2 遗留的两类缺陷——否则前台 Home / About / Contact / 招聘 等页面将因 HTTP 500 无法渲染：

1. **schema 时间字段类型错误（Pydantic 校验 500）**
   - `CompanyInfoOut.updated_at`、`JobOut.created_at / updated_at`、`AboutSectionOut.updated_at` 被声明为 `Optional[str]`，但 ORM 列是 `DateTime`，`model_validate` 直接抛校验错误 → 500。
   - 修复：上述字段改为 `Optional[datetime]`（对齐 `content.py` / `crm.py` 中其它 `*Out` 的写法）。
   - 涉及文件：`backend/app/schemas/content.py`、`backend/app/schemas/crm.py`。
2. **演示目录种子缺失（前台无数据可渲染）**
   - M2 的 `seed()` 仅初始化 角色 / 公司信息 / 超管，未灌入任何 产品 / 案例 / 新闻 / 轮播 / 历程 / 关于 / 招聘 数据，导致前台列表全空、首页聚合 `recommended_products` 为空。
   - 修复：在 `backend/app/core/db.py` 的 `seed()` 中新增 `_seed_catalog(db)` 幂等种子（系列 3、空间分类 3、产品 10、案例 5、新闻 4、轮播 3、历程 5、关于板块 2、招聘 4）。图片字段留空 → 前台走胡桃木渐变占位，无需外部素材，满足“无 key 即可演示”P0。种子按 FK 顺序插入，重复运行安全。

> 修复后重启后端并跑通 **24 项契约校验**（首页聚合、产品/案例/新闻/招聘分页、详情、关于四子页、轮播、留言/求职 POST 与 400 校验），全部 PASS。
> 验证过程中曾因 `psycopg2-binary` 在无 C 编译环境的 Windows 上构建失败，已改为仅安装 dev 子集（SQLite + 内存限频，跳过 psycopg2/redis），不影响功能。
