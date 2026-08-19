# 开发技术文档 — Rz家居网站（前台官网 + 后台管理系统）

> 版本：v1.2
> 日期：2026-08-17
> 作者：WorkBuddy（开发技术，基于 PRD v0.5 + UI/UX v1.0）
> 依据：`PRD_企业家居网站.md`（v0.5）、`UIUX_Rz家居网站.md`（v1.0）
> 技术栈：后端 Python + FastAPI + SQLAlchemy；前端 React + Tailwind CSS（官网）/ Ant Design（后台）；数据库 开发 SQLite / 生产 PostgreSQL
> 文档状态：v1.2 补充 SVG 图示（E-R 图/前台模块/后台模块），待研发评审

---

## 文档信息与修订记录

| 项 | 内容 |
| --- | --- |
| 产品名称 | Rz家居网站（企业官网系统 + 后台管理系统） |
| 文档版本 | v1.2 |
| 创建日期 | 2026-08-17 |
| 适用范围 | 前后端工程实现、联调、部署 |
| 评审状态 | 待技术负责人 / 研发确认 |

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-08-17 | 首版开发技术文档。技术架构按确认决策：Python+FastAPI+SQLite(开发)/PostgreSQL(生产)+React+Tailwind(前台)+Ant Design(后台) |
| v1.1 | 2026-08-17 | 补充「绘图与图示约定」；调用架构图与流程图绘制专家技能，将 §2.1 总体架构、§4.1 ER 关系、§5.2 鉴权流程以 Mermaid（架构图/erDiagram/时序图）嵌入；双库与三角色权限保持一致 |
| v1.2 | 2026-08-17 | 调用架构图与流程图绘制专家技能生成 3 张 SVG 图片并嵌入：§4.1 E-R 关系图（er_diagram.svg）、§6.0 前台模块架构图（frontend_modules.svg）、§7.0 后台模块架构图（backend_modules.svg）；Mermaid 源码保留，SVG 便于直接预览 |

---

### 绘图与图示约定（使用「架构图与流程图绘制专家」技能）
- 本文档凡涉及**系统架构图、E-R 图、流程图（时序 / 状态机 / 业务流）**等图示，均调用「架构图与流程图绘制专家」技能生成，并以 **Mermaid** 语法嵌入本文档（可在支持 Mermaid 的 Markdown 查看器中直接渲染），确保图示与正文同源、可版本化管理。
- 图示清单（Mermaid 源码 + SVG 图片同步维护）：
  - 系统架构图：§2.1（Mermaid）
  - JWT 鉴权时序图：§5.2（Mermaid）
  - E-R 关系图：§4.1（Mermaid 源码 + `assets/er_diagram.svg`）
  - 前台模块架构图：§6.0（`assets/frontend_modules.svg`）
  - 后台模块架构图：§7.0（`assets/backend_modules.svg`）
- SVG 图片由「架构图与流程图绘制专家」技能按统一设计语言（实体矩形/分层配色/箭头规范）绘制，存放于 `assets/` 目录，在支持图片渲染的 Markdown 查看器中直接显示；Mermaid 源码保留以便版本管理与二次编辑。
- 图示中实体 / 字段命名、技术栈、双库策略、三角色权限等，均与本文 §4 数据模型、§5 接口设计、§2 技术架构保持一致。

## 0. 术语表

| 术语 | 含义 |
| --- | --- |
| 展示型内容 | 产品/系列/分类/案例/新闻/关于我们/轮播——由"内容编辑"维护（PRD 5.1） |
| 线索型内容 | 留言（联系/应聘）+ 招聘职位——由"客服/HR"维护（PRD 5.1） |
| AccessToken | 短期 JWT（默认 30 min），调用管理接口携带 |
| RefreshToken | 长期 JWT（默认 7 d），用于换取新 AccessToken，可吊销 |
| job_application | 应聘留言，`message.type` 取值，带 `ref_id` 关联 `job.id` |
| 富文本 | Tiptap 产出的 HTML，入库前经净化（见 §8.4） |
| 双库 | 开发 SQLite、生产 PostgreSQL，由环境变量切换 |

---

## 1. 概述与范围

### 1.1 目标
将 PRD 的**需求**与 UI/UX 的**界面规范**翻译为可执行的工程交付物：数据库、接口、前后端代码结构、开发流程、安全合规与测试策略。

### 1.2 交付范围（v1）
- 前台官网：5 主导航 + 二级，共 9 类页面（首页 / 产品中心 / 新案例 / 新闻 / 招聘 / 关于我们四子页）+ 全局（导航、页脚、搜索占位、响应式、SEO 基础）。
- 后台管理系统：登录 + 三角色权限 + 控制台 + 内容/招聘/留言/轮播/系统/统计模块。
- 后端：FastAPI 服务，公开接口 16 项 + 管理接口 22 项，数据库 14 张表。

### 1.3 不在范围内（继承 PRD 1.5 Non-goals）
在线商城 / 支付 / 前台会员 / 多语言 / CMS 自定义装修 / 营销自动化 / 招商加盟 / 暗色模式。

### 1.4 技术约束
- 前后端分离；后端仅提供 JSON API，不渲染页面。
- 统一响应信封（见 §5.1）；时间统一 ISO8601 UTC（见 §8.3）。
- 数据库可移植：开发 SQLite、生产 PostgreSQL，代码零方言（见 §2.3、§4）。

---

## 2. 技术选型与架构

### 2.1 总体架构

> 下图由「架构图与流程图绘制专家」技能生成（Mermaid 语法，可在支持 Mermaid 的 Markdown 查看器中渲染）。

```mermaid
flowchart LR
    subgraph FE["前端层 (React)"]
        WEB["官网<br/>React + Tailwind CSS"]
        ADM["后台<br/>React + Ant Design"]
    end
    subgraph BE["后端层 (FastAPI + Uvicorn)"]
        PUB["公开接口 /api/*"]
        MGT["管理接口 /api/admin/*"]
        SEC["JWT 鉴权 · 上传 · 限频"]
    end
    ORM[("SQLAlchemy 2.0 ORM")]
    subgraph DB["数据库（双库可移植）"]
        SQ["SQLite（开发）"]
        PG["PostgreSQL（生产）"]
    end
    RDS[("Redis（可选）<br/>RefreshToken 吊销")]
    subgraph INF["基础设施 / 部署"]
        DOCK["Docker Compose"]
        NGX["Nginx 反代"]
        CI["GitHub Actions"]
    end

    WEB --> PUB
    ADM --> MGT
    PUB --> SEC
    MGT --> SEC
    SEC --> ORM
    ORM --> SQ
    ORM --> PG
    SEC -.-> RDS
    CI --> DOCK
    DOCK --> NGX
```

部署：Docker + Docker Compose；Nginx 反代静态资源 + 反代 API；GitHub Actions CI/CD。

### 2.2 技术栈（已确认）

| 层 | 技术 | 说明 |
| --- | --- | --- |
| 后端语言 | Python 3.11+ | 运行时 |
| Web 框架 | FastAPI + Uvicorn | 异步、自带 OpenAPI/Swagger |
| ORM | SQLAlchemy 2.0（声明式 Mapped） | 双库可移植核心（§4） |
| 迁移 | Alembic | 双库迁移脚本 |
| 校验 | Pydantic v2 | 请求/响应模型 |
| 鉴权 | python-jose + passlib(bcrypt) | JWT Access + Refresh |
| 数据库 | **开发 SQLite / 生产 PostgreSQL** | 由 `DATABASE_URL` 切换 |
| 缓存/会话 | Redis（可选） | 存 RefreshToken 黑名单/白名单，可吊销 |
| 文件 | 本地 `uploads/`（Docker 卷） | 抽象为存储接口，可换 COS/S3 |
| 官网前端 | React 18 + TypeScript + Vite + Tailwind CSS | 品牌定制（UI/UX 2.2） |
| 后台前端 | React 18 + TypeScript + Vite + Ant Design 5 | 企业级组件 |
| 路由 | React Router v6 | 前台/后台各自路由 |
| 状态 | Zustand（官网）/ Redux Toolkit（后台可选） | 轻量 |
| 请求 | Axios + 拦截器 | 统一错误处理、401 续期 |
| 富文本 | Tiptap | 输出 HTML，入库前净化 |

### 2.3 双库可移植约定（关键）
- ORM 统一用 **SQLAlchemy 2.0**，禁止手写方言原生 SQL。
- 枚举（`status`/`type`/`category` 等）用**应用层校验**（Pydantic `Literal`/`Enum`），不直接依赖数据库 enum 类型（SQLite 无原生 enum）。
- `JSON` 字段用 SQLAlchemy `JSON` 类型（SQLite 存 TEXT，PG 存 jsonb，ORM 透明处理）。
- 主键统一 `Integer` 自增；时间统一 `DateTime(timezone=True)`（SQLite 存 UTC 字符串，PG 存 timestamptz）。
- 连接串切换，代码零改动：
  - 开发：`SQLITE_URL=sqlite:///./rz_home.db`
  - 生产：`DATABASE_URL=postgresql+psycopg://user:pwd@host:5432/rz_home`
- 测试：单测跑 SQLite（快）；CI 集成测试跑 PostgreSQL（保两端一致）。

### 2.4 目录结构（Monorepo）
```
rz-home/
├─ backend/                # FastAPI 服务
│  ├─ app/
│  │  ├─ main.py           # 入口、CORS、路由挂载
│  │  ├─ core/             # config(环境变量)、security(JWT/bcrypt)、db(engine/session)、errors、response
│  │  ├─ models/           # SQLAlchemy 模型（14 张表）
│  │  ├─ schemas/          # Pydantic 请求/响应模型
│  │  ├─ routers/          # 公开 /api/* 与 管理 /api/admin/*
│  │  ├─ services/         # 业务逻辑（CRUD、鉴权、上传、统计）
│  │  ├─ deps/             # 依赖注入（get_db、get_current_admin、require_role）
│  │  └─ static/uploads/   # 上传文件（dev）
│  ├─ alembic/             # 迁移脚本
│  ├─ tests/               # pytest
│  └─ pyproject.toml
├─ frontend/
│  ├─ web/                 # 官网（Tailwind）
│  │  ├─ src/{pages,components,api,store,styles,hooks}
│  │  └─ vite.config.ts
│  └─ admin/               # 后台（Ant Design）
│     ├─ src/{pages,components,api,store,theme,layouts}
│     └─ vite.config.ts
├─ docker-compose.yml      # backend + (pg) + nginx + redis(可选)
└─ .github/workflows/      # CI/CD
```

---

## 3. 工程结构与开发流程

### 3.1 分支模型（Trunk-Based 简化版）
- `main`：可发布主干，受保护，需 PR + 评审。
- `feat/*`、`fix/*`、`chore/*`：短期功能分支，完成后合 `main`。
- 提交信息约定：`feat(admin): 职位管理 CRUD`、`fix(api): 消息 ref_id 校验`。

### 3.2 三环境与配置
| 环境 | 数据库 | 前端 API 目标 | 说明 |
| --- | --- | --- | --- |
| dev | SQLite（本地文件） | `http://localhost:8000` | 本地联调，Vite 代理 `/api` |
| test | PostgreSQL（容器） | 测试部署地址 | CI 集成测试 |
| prod | PostgreSQL | 生产域名 | Nginx 反代 |

- 所有配置经环境变量（见 §12.4），**禁止硬编码密钥**。
- `.env.example` 提交仓库，真实 `.env` 不提交（gitignore）。

### 3.3 本地联调
- 后端：`uvicorn app.main:app --reload --port 8000`，Swagger 在 `/docs`。
- 前端：`vite` dev server，配置 `server.proxy` 将 `/api` 代理到 `:8000`，规避 CORS（生产由 Nginx 统一反代，亦不跨域）。
- CORS：开发期后端 `allow_origins` 含 `localhost:5173`；生产关闭或仅放行自有域名（§9.1）。

### 3.4 CI/CD（GitHub Actions）
- PR 触发：`ruff`  lint + `pytest`（SQLite）+ 前端 `tsc`/`eslint`/`vitest` 构建。
- 合 `main` 触发：构建镜像 → 推 registry → 部署 test → 人工确认 → 部署 prod。
- 集成测试阶段用 PostgreSQL 服务容器，跑 Alembic `upgrade` + 接口测试，验证双库一致。

### 3.5 代码规范
- 后端：Ruff（格式化 + lint）、类型注解必填、路由层只做参数校验与调用 service。
- 前端：ESLint + Prettier、组件按页面/通用分层、`api/*` 收敛所有请求。

---

## 4. 数据库设计

> **本节包含完整的数据库设计**（ER 关系图、14 张表数据字典、生产 PostgreSQL / 开发 SQLite 双库建表 SQL、索引设计、初始化 seed 数据、迁移与版本管理、附录）。原独立《数据库设计文档》的权威内容已完整并入此处，本文档即为数据库设计的唯一来源，便于评审与交付。

### 4.1 ER 关系图（由「架构图与流程图绘制专家」技能生成，Mermaid erDiagram）

```mermaid
erDiagram
    %% 业务核心域
    product_series ||--o{ product : "series_id"
    category ||--o{ product : "category_id"
    category ||--o{ category : "parent_id 自引用"
    %% 互动与内容域
    job ||--o{ message : "ref_id (type=job_application)"
    %% 权限与安全域
    role ||--o{ admin_user : "role_id"
    admin_user ||--o{ audit_log : "admin_id"

    product_series {
        int id PK
        string name
        string slug UK
        string status
    }
    category {
        int id PK
        string name
        int parent_id FK "→ category.id"
        string status
    }
    product {
        int id PK
        int series_id FK "→ product_series.id"
        int category_id FK "→ category.id"
        string name
        string model_no
        float price
        string status
    }
    cases {
        int id PK
        string title
        string category
        string status
    }
    news {
        int id PK
        string title
        string category
        string status
    }
    job {
        int id PK
        string title
        string type
        string status
    }
    message {
        int id PK
        string type
        int ref_id FK "→ job.id"
        string name
    }
    banner {
        int id PK
        string title
        string image
        string status
    }
    company_info {
        int id PK "单行 id=1"
        string name
        int founded_year
    }
    about_section {
        int id PK
        string code
        string title
    }
    milestone {
        int id PK
        string year
        string title
    }
    role {
        int id PK
        string name UK
        json permissions
    }
    admin_user {
        int id PK
        string username UK
        int role_id FK "→ role.id"
        string status
    }
    audit_log {
        int id PK
        int admin_id FK "→ admin_user.id"
        string action
        string target_type
    }
```

> 说明：共 14 个实体、6 条外键关系 —— `product_series`/`category` 1—N `product`；`category` 自引用（`parent_id`→`category.id`）；`job` 1—N `message`（`message.ref_id`=`job.id`，仅 `type=job_application`）；`role` 1—N `admin_user`；`admin_user` 1—N `audit_log`。`cases`/`news`/`banner`/`company_info`/`about_section`/`milestone` 为内容配置型表，无外键依赖（图中悬空）。完整字段见 §4.3 数据字典。

![E-R 关系图（SVG，由「架构图与流程图绘制专家」技能生成）](./assets/er_diagram.svg)

> 上图按「业务核心域 / 互动与内容域 / 权限与安全域」三个域分组展示 E-R 关系，crow's-foot 表示「多」端；Mermaid 源码保留以便版本管理与二次编辑。



### 4.2 设计原则与数据库约定

#### 4.2.1 命名规范
- 表名：`snake_case`、全小写、英文单数（一个实体一张表）；**避开 SQL 关键字**——案例表命名为 `cases`（非 `case`）。
- 字段：同 `snake_case`；主键统一 `id`；外键统一 `<关联表>_id`（如 `series_id`、`role_id`）；时间统一 `created_at` / `updated_at`。
- 布尔字段 `is_` 前缀（`is_recommended`、`is_new`、`is_top`）。
- 枚举字段用 `status` / `type` / `category` 等短字符串，值用 snake/英文小写。

#### 4.2.2 字符集与时区
- 字符集：`utf8mb4`（MySQL 语义）/ PG `UTF8` / SQLite 默认 UTF-8，确保中文与 emoji 正常。
- 时间：统一 **UTC 存储**（`DateTime(timezone=True)` → PG `TIMESTAMPTZ`、SQLite `TEXT` 存储 UTC 字符串，建议统一为 `YYYY-MM-DDThh:mm:ssZ` 格式以避免歧义）；展示层按访问者时区转换。
- `created_at` 默认 `now()`（UTC）。`updated_at` **不依赖数据库触发器**，由 ORM 层 `onupdate=func.now()` 在 UPDATE 时自动赋值（SQLite 无 `ON UPDATE` 语法、PG 亦不强制；应用层统一维护可保证双库一致）。
- **时间戳约定例外**（系统/审计类表）：`message` 用 `replied_at` 表征最后活动时间；`admin_user` 用 `last_login_at`；`audit_log` 仅 `created_at`（写入后不可变）；`role` 为低频系统配置、不加时间戳。内容类表（product_series / category / product / cases / news / job / banner / company_info / about_section / milestone）统一携带 `updated_at`。

#### 4.2.3 枚举与约束
- **枚举值在应用层（Pydantic）校验，不在数据库层建 CHECK**——确保 SQLite 与 PostgreSQL 行为一致（与开发技术文档 §4.3 一致）。
- 唯一约束在数据库层建立：`slug`（series/category）、`username`、`role.name`、`company_info` 单行（应用层保障 id=1）。
- 外键开启级联限制：`ON DELETE RESTRICT`（PG）/ `PRAGMA foreign_keys=ON`（SQLite），避免误删主数据。

#### 4.2.4 特殊字段处理
- **JSON 字段**（`images`、`specs`、`permissions`）：PG 用 `JSONB`，SQLite 用 `TEXT`（存储 JSON 字符串），ORM `JSON` 类型透明处理。
- **富文本**（`product.description`、`news.content`、`message.content` 等）：存储已净化的 HTML 字符串（见开发技术文档 §8 净化约定）。
- **自增主键**：PG `SERIAL`/`BIGSERIAL`，SQLite `INTEGER PRIMARY KEY AUTOINCREMENT`。
- **软删除**：统一用 `status` 字段标记（如 `active`/`hidden`、`draft`/`published`、`new`/`handled`/`ignored`、`active`/`disabled`），**不做物理删除**；统计/展示仅读取有效状态。

#### 4.2.5 索引策略
- 所有外键列建索引。
- 高频列表/筛选列建索引：`status`、`type`、`category`、`created_at`。
- 唯一键自动建索引（`slug`、`username`、`role.name`）。

---



### 4.3 数据字典

> 字段类型标注为**逻辑类型**；具体物理类型见 §5 建表 SQL。
> 约束缩写：PK=主键，FK=外键，NN=非空，UQ=唯一，IX=索引，DFT=默认值。

#### 4.3.1 product_series（产品系列）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 系列 ID | AUTO_INCREMENT |
| name | VARCHAR(120) | 是 | — | — | — | — | 系列名称（如 胡桃禮、如意春） | — |
| slug | VARCHAR(160) | 是 | — | — | — | 是 | 英文短链标识，SEO 友好 | UNIQUE |
| description | TEXT | 否 | NULL | — | — | — | 系列描述 | — |
| cover_image | VARCHAR(512) | 否 | NULL | — | — | — | 封面图 URL | — |
| sort_order | INT | 否 | 0 | — | — | — | 排序权重（小靠前） | — |
| status | VARCHAR(20) | 否 | active | — | — | 是 | 状态标识 | active\|hidden |

- **业务归属**：PRD §4.2 产品中心 / 系列列表；管理接口 `/api/admin/product-series`。
- **枚举**：status ∈ {active, hidden}。
- **示例**：`(1, '胡桃禮', 'walnut-ritual', '新中式实木系列', '/img/...', 0, 'active')`

#### 4.3.2 category（空间分类）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 分类 ID | AUTO_INCREMENT |
| name | VARCHAR(120) | 是 | — | — | — | — | 分类名（客厅/卧室/书房/茶室/餐厅） | — |
| slug | VARCHAR(160) | 是 | — | — | — | 是 | 短链标识 | UNIQUE |
| parent_id | INT | 否 | NULL | — | category.id | — | 父分类（自引用，支持多级） | FOREIGN KEY → category.id |
| sort_order | INT | 否 | 0 | — | — | — | 排序 | — |
| status | VARCHAR(20) | 否 | active | — | — | 是 | 状态标识 | active\|hidden |
| updated_at | TIMESTAMPTZ | 否 | now() | — | — | — | 更新时间 | — |

- **业务归属**：PRD §4.2 产品中心空间筛选；`parent_id` 支持二级分类（如 客厅 → 沙发）。
- **枚举**：status ∈ {active, hidden}。

#### 4.3.3 product（产品）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 产品 ID | AUTO_INCREMENT |
| series_id | INT | 否 | NULL | — | product_series.id | 是 | 所属系列 | FOREIGN KEY → product_series.id |
| category_id | INT | 否 | NULL | — | category.id | 是 | 所属空间分类 | FOREIGN KEY → category.id |
| name | VARCHAR(200) | 是 | — | — | — | — | 产品名称 | — |
| model_no | VARCHAR(80) | 否 | NULL | — | — | — | 型号 | — |
| summary | TEXT | 否 | NULL | — | — | — | 简介 | — |
| description | TEXT | 否 | NULL | — | — | — | 详情（净化 HTML） | — |
| images | JSON | 否 | [] | — | — | — | 图集 URL 数组 | — |
| specs | JSON | 否 | {} | — | — | — | 规格键值对（材质/尺寸…） | — |
| price | FLOAT | 否 | NULL | — | — | — | 展示参考价（非交易） | — |
| is_recommended | BOOLEAN | 否 | false | — | — | — | 是否首页推荐 | — |
| status | VARCHAR(20) | 否 | active | — | — | 是 | 状态标识 | active\|hidden |
| created_at | TIMESTAMPTZ | 否 | now() | — | — | — | 创建时间 | — |
| updated_at | TIMESTAMPTZ | 否 | now() | — | — | — | 更新时间 | — |

- **业务归属**：PRD §4.2 产品中心列表/详情；前台 `/products`。
- **枚举**：status ∈ {active, hidden}。
- **索引**：series_id、category_id、status。

#### 4.3.4 cases（案例，表名避关键字）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 案例 ID | AUTO_INCREMENT |
| title | VARCHAR(200) | 是 | — | — | — | — | 案例标题 | — |
| category | VARCHAR(20) | 否 | 住宅 | — | — | 是 | 分类标识 | 住宅\|工程\|商业 |
| cover_image | VARCHAR(512) | 否 | NULL | — | — | — | 封面 | — |
| images | JSON | 否 | [] | — | — | — | 图集 | — |
| summary | TEXT | 否 | NULL | — | — | — | 摘要 | — |
| content | TEXT | 否 | NULL | — | — | — | 正文 | — |
| is_new | BOOLEAN | 否 | false | — | — | — | 是否标记「新」 | — |
| sort_order | INT | 否 | 0 | — | — | — | 排序 | — |
| status | VARCHAR(20) | 否 | active | — | — | 是 | 状态标识 | active\|hidden |
| created_at | TIMESTAMPTZ | 否 | now() | — | — | — | 创建时间 | — |
| updated_at | TIMESTAMPTZ | 否 | now() | — | — | — | 更新时间 | — |

- **业务归属**：PRD §4.3 新案例展示；表名 `cases`（避开 SQL 关键字 `case`）。
- **枚举**：category ∈ {住宅, 工程, 商业}；status ∈ {active, hidden}。

#### 4.3.5 news（新闻资讯）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 新闻 ID | AUTO_INCREMENT |
| title | VARCHAR(200) | 是 | — | — | — | — | 标题 | — |
| category | VARCHAR(20) | 否 | company | — | — | 是 | 分类标识 | company\|industry |
| cover_image | VARCHAR(512) | 否 | NULL | — | — | — | 封面 | — |
| summary | TEXT | 否 | NULL | — | — | — | 摘要 | — |
| content | TEXT | 否 | NULL | — | — | — | 正文（净化 HTML） | — |
| author | VARCHAR(80) | 否 | NULL | — | — | — | 作者 | — |
| published_at | TIMESTAMPTZ | 否 | NULL | — | — | — | 发布时间 | — |
| is_top | BOOLEAN | 否 | false | — | — | — | 是否置顶 | — |
| status | VARCHAR(20) | 否 | draft | — | — | 是 | 状态标识 | draft\|published |
| created_at | TIMESTAMPTZ | 否 | now() | — | — | — | 创建时间 | — |
| updated_at | TIMESTAMPTZ | 否 | now() | — | — | — | 更新时间 | — |

- **业务归属**：PRD §4.4 新闻（企业新闻/行业资讯，由 category 区分）。
- **枚举**：category ∈ {company, industry}；status ∈ {draft, published}。

#### 4.3.6 job（招聘职位）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 职位 ID | AUTO_INCREMENT |
| type | VARCHAR(20) | 否 | social | — | — | 是 | 类型标识 | social\|campus |
| title | VARCHAR(200) | 是 | — | — | — | — | 职位名称 | — |
| department | VARCHAR(80) | 否 | NULL | — | — | — | 部门 | — |
| city | VARCHAR(80) | 否 | NULL | — | — | — | 工作城市 | — |
| salary | VARCHAR(80) | 否 | NULL | — | — | — | 薪资（展示文本/区间） | — |
| description | TEXT | 否 | NULL | — | — | — | 职责描述 | — |
| requirements | TEXT | 否 | NULL | — | — | — | 任职要求 | — |
| headcount | INT | 否 | NULL | — | — | — | 招聘人数 | — |
| status | VARCHAR(20) | 否 | active | — | — | 是 | 状态标识 | active\|hidden |
| publish_at | TIMESTAMPTZ | 否 | NULL | — | — | — | 发布时间 | — |
| created_at | TIMESTAMPTZ | 否 | now() | — | — | — | 创建时间 | — |
| updated_at | TIMESTAMPTZ | 否 | now() | — | — | — | 更新时间 | — |

- **业务归属**：PRD §4.5 招聘入口（社会/校园，由 type 区分）；职位详情「投递意向」写入 `message`。
- **枚举**：type ∈ {social, campus}；status ∈ {active, hidden}。

#### 4.3.7 message（留言 / 线索）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 留言 ID | AUTO_INCREMENT |
| type | VARCHAR(20) | 否 | contact | — | — | 是 | 类型标识 | contact\|job_application |
| ref_id | INT | 否 | NULL | — | — | 是 | type=job_application 时 = job.id | — |
| name | VARCHAR(80) | 是 | — | — | — | — | 姓名 | — |
| phone | VARCHAR(40) | 是 | — | — | — | — | 电话 | — |
| email | VARCHAR(160) | 否 | NULL | — | — | — | 邮箱 | — |
| content | TEXT | 是 | — | — | — | — | 留言内容 | — |
| status | VARCHAR(20) | 否 | new | — | — | 是 | 状态标识 | new\|handled\|ignored |
| reply | TEXT | 否 | NULL | — | — | — | 回复内容 | — |
| replied_at | TIMESTAMPTZ | 否 | NULL | — | — | — | 回复时间 | — |
| created_at | TIMESTAMPTZ | 否 | now() | — | — | 是 | 提交时间 | — |

- **业务归属**：PRD §4.5/§4.6 联系我们 + 应聘留言；后台留言管理（联系/应聘分类）。
- **关键关系**：`type=job_application` 时 `ref_id` → `job.id`（HR 在后台可见关联职位）。
- **枚举**：type ∈ {contact, job_application}；status ∈ {new, handled, ignored}。

#### 4.3.8 banner（轮播图）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 轮播 ID | AUTO_INCREMENT |
| title | VARCHAR(200) | 是 | — | — | — | — | 标题 | — |
| image | VARCHAR(512) | 是 | — | — | — | — | 图片 URL | — |
| link_url | VARCHAR(512) | 否 | NULL | — | — | — | 点击跳转链接 | — |
| sort_order | INT | 否 | 0 | — | — | — | 排序 | — |
| status | VARCHAR(20) | 否 | active | — | — | 是 | 状态标识 | active\|hidden |
| start_time | TIMESTAMPTZ | 否 | NULL | — | — | — | 上架时间 | — |
| end_time | TIMESTAMPTZ | 否 | NULL | — | — | — | 下架时间 | — |
| created_at | TIMESTAMPTZ | 否 | now() | — | — | — | 创建时间 | — |
| updated_at | TIMESTAMPTZ | 否 | now() | — | — | — | 更新时间 | — |

- **业务归属**：PRD §4.1 首页轮播；管理接口 `/api/admin/banners`。
- **枚举**：status ∈ {active, hidden}。

#### 4.3.9 company_info（公司信息，单行配置）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 固定 =1 | AUTO_INCREMENT |
| name | VARCHAR(200) | 否 | 'Rz家居' | — | — | — | 公司/品牌名 | — |
| logo_url | VARCHAR(512) | 否 | NULL | — | — | — | Logo | — |
| founded_year | INT | 否 | NULL | — | — | — | 建厂/成立年份 | — |
| honor_count | INT | 否 | NULL | — | — | — | 荣誉数量 | — |
| production_line_count | INT | 否 | NULL | — | — | — | 智能化生产线数 | — |
| address | VARCHAR(300) | 否 | NULL | — | — | — | 地址 | — |
| phone | VARCHAR(40) | 否 | NULL | — | — | — | 联系电话 | — |
| email | VARCHAR(160) | 否 | NULL | — | — | — | 邮箱 | — |
| wechat | VARCHAR(80) | 否 | NULL | — | — | — | 微信公众号 | — |
| icp_no | VARCHAR(40) | 否 | NULL | — | — | — | ICP 备案号 | — |
| intro | TEXT | 否 | NULL | — | — | — | 公司简介 | — |
| updated_at | TIMESTAMPTZ | 否 | now() | — | — | — | 更新时间 | — |

- **业务归属**：PRD §4.1 企业实力数据 / §4.6 联系我们；首页与联系页统一读取此表。
- **约定**：单行配置，应用层保障仅 id=1 一条。

#### 4.3.10 about_section（关于我们区块）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 区块 ID | AUTO_INCREMENT |
| code | VARCHAR(20) | 是 | — | — | — | 是 | 区块编码 | overview\|brand |
| title | VARCHAR(200) | 是 | — | — | — | — | 区块标题 | — |
| content | TEXT | 否 | NULL | — | — | — | 区块内容（净化 HTML） | — |
| cover_image | VARCHAR(512) | 否 | NULL | — | — | — | 配图 | — |
| sort_order | INT | 否 | 0 | — | — | — | 排序 | — |
| status | VARCHAR(20) | 否 | active | — | — | 是 | 状态标识 | active\|hidden |
| updated_at | TIMESTAMPTZ | 否 | now() | — | — | — | 更新时间 | — |

- **业务归属**：PRD §4.6 关于Rz（code=overview）/ 品牌介绍（code=brand）；由后台「关于我们配置」维护。
- **枚举**：code ∈ {overview, brand}；status ∈ {active, hidden}。

#### 4.3.11 milestone（发展历程）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 里程碑 ID | AUTO_INCREMENT |
| year | VARCHAR(20) | 是 | — | — | — | — | 年份（如 1953 / 2020s） | — |
| title | VARCHAR(200) | 是 | — | — | — | — | 标题 | — |
| description | TEXT | 否 | NULL | — | — | — | 描述 | — |
| image | VARCHAR(512) | 否 | NULL | — | — | — | 配图 | — |
| sort_order | INT | 否 | 0 | — | — | — | 时间轴顺序 | — |
| status | VARCHAR(20) | 否 | active | — | — | 是 | 状态标识 | active\|hidden |
| created_at | TIMESTAMPTZ | 否 | now() | — | — | — | 创建时间 | — |
| updated_at | TIMESTAMPTZ | 否 | now() | — | — | — | 更新时间 | — |

- **业务归属**：PRD §4.6 发展历程时间轴。
- **枚举**：status ∈ {active, hidden}。

#### 4.3.12 role（角色）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 角色 ID | AUTO_INCREMENT |
| name | VARCHAR(80) | 是 | — | — | — | 是 | 名称 | UNIQUE, super_admin\|editor\|cs_hr |
| permissions | JSON | 否 | {} | — | — | — | 权限矩阵 {模块:[read,write]} | — |

- **业务归属**：开发技术文档 §7.4 三角色权限；`permissions` 形如 `{"products":["read","write"],"messages":["read","write"]}`。
- **枚举**：name ∈ {super_admin, editor, cs_hr}。
- **预置**：super_admin（全量）、editor（展示型内容）、cs_hr（线索型内容+招聘）。

#### 4.3.13 admin_user（管理员）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 管理员 ID | AUTO_INCREMENT |
| username | VARCHAR(80) | 是 | — | — | — | 是 | 登录名 | UNIQUE |
| password_hash | VARCHAR(255) | 是 | — | — | — | — | bcrypt 哈希（cost≥12） | — |
| display_name | VARCHAR(120) | 否 | NULL | — | — | — | 显示名 | — |
| role_id | INT | 是 | — | — | role.id | — | 角色 | FOREIGN KEY → role.id |
| status | VARCHAR(20) | 否 | active | — | — | 是 | 状态标识 | active\|disabled |
| last_login_at | TIMESTAMPTZ | 否 | NULL | — | — | — | 最近登录 | — |
| created_at | TIMESTAMPTZ | 否 | now() | — | — | — | 创建时间 | — |

- **业务归属**：开发技术文档 §5.1 登录与权限；`role_id` 决定菜单与操作边界。
- **枚举**：status ∈ {active, disabled}。

#### 4.3.14 audit_log（审计日志，P1）

| 字段名 | 类型(长度) | 必值 | 默认值 | 主键 | 外键 | 索引 | 说明 | 枚举/约束 |
|---|---|---|---|---|---|---|---|---|
| id | INT | 是 | — | PK | — | 是 | 日志 ID | AUTO_INCREMENT |
| admin_id | INT | 否 | NULL | — | admin_user.id | — | 操作人 | FOREIGN KEY → admin_user.id |
| action | VARCHAR(40) | 是 | — | — | — | — | 操作类型 | create\|update\|delete\|login |
| target_type | VARCHAR(40) | 否 | NULL | — | — | — | 对象类型（如 product） | — |
| target_id | INT | 否 | NULL | — | — | — | 对象 ID | — |
| detail | TEXT | 否 | NULL | — | — | — | 变更摘要 | — |
| created_at | TIMESTAMPTZ | 否 | now() | — | — | 是 | 操作时间 | — |

- **业务归属**：开发技术文档 §9 合规审计；P1 落库（建表但 v1 可仅记录登录与关键写操作）。
- **枚举**：action ∈ {create, update, delete, login}。

---

### 4.4 建表 SQL

#### 4.4.1 生产环境 PostgreSQL DDL（权威版）

```sql
-- ============ 内容 / 展示 ============
CREATE TABLE product_series (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    slug          VARCHAR(160) NOT NULL UNIQUE,
    description   TEXT,
    cover_image   VARCHAR(512),
    sort_order    INTEGER DEFAULT 0,
    status        VARCHAR(20) DEFAULT 'active',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_product_series_status ON product_series(status);

CREATE TABLE category (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    slug          VARCHAR(160) NOT NULL UNIQUE,
    parent_id     INTEGER REFERENCES category(id) ON DELETE RESTRICT,
    sort_order    INTEGER DEFAULT 0,
    status        VARCHAR(20) DEFAULT 'active',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_category_status ON category(status);
CREATE INDEX ix_category_parent_id ON category(parent_id);

CREATE TABLE product (
    id            SERIAL PRIMARY KEY,
    series_id     INTEGER REFERENCES product_series(id) ON DELETE RESTRICT,
    category_id   INTEGER REFERENCES category(id) ON DELETE RESTRICT,
    name          VARCHAR(200) NOT NULL,
    model_no      VARCHAR(80),
    summary       TEXT,
    description   TEXT,
    images        JSONB DEFAULT '[]'::jsonb,
    specs         JSONB DEFAULT '{}'::jsonb,
    price         DOUBLE PRECISION,
    is_recommended BOOLEAN DEFAULT false,
    status        VARCHAR(20) DEFAULT 'active',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_product_series_id ON product(series_id);
CREATE INDEX ix_product_category_id ON product(category_id);
CREATE INDEX ix_product_status ON product(status);

CREATE TABLE cases (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    category      VARCHAR(20) DEFAULT '住宅',
    cover_image   VARCHAR(512),
    images        JSONB DEFAULT '[]'::jsonb,
    summary       TEXT,
    content       TEXT,
    is_new        BOOLEAN DEFAULT false,
    sort_order    INTEGER DEFAULT 0,
    status        VARCHAR(20) DEFAULT 'active',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_cases_category ON cases(category);
CREATE INDEX ix_cases_status ON cases(status);

CREATE TABLE news (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    category      VARCHAR(20) DEFAULT 'company',
    cover_image   VARCHAR(512),
    summary       TEXT,
    content       TEXT,
    author        VARCHAR(80),
    published_at  TIMESTAMPTZ,
    is_top        BOOLEAN DEFAULT false,
    status        VARCHAR(20) DEFAULT 'draft',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_news_category ON news(category);
CREATE INDEX ix_news_status ON news(status);

CREATE TABLE job (
    id            SERIAL PRIMARY KEY,
    type          VARCHAR(20) DEFAULT 'social',
    title         VARCHAR(200) NOT NULL,
    department    VARCHAR(80),
    city          VARCHAR(80),
    salary        VARCHAR(80),
    description   TEXT,
    requirements  TEXT,
    headcount     INTEGER,
    status        VARCHAR(20) DEFAULT 'active',
    publish_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_job_type ON job(type);
CREATE INDEX ix_job_status ON job(status);

CREATE TABLE message (
    id            BIGSERIAL PRIMARY KEY,
    type          VARCHAR(20) DEFAULT 'contact',
    ref_id        INTEGER REFERENCES job(id) ON DELETE RESTRICT,
    name          VARCHAR(80) NOT NULL,
    phone         VARCHAR(40) NOT NULL,
    email         VARCHAR(160),
    content       TEXT NOT NULL,
    status        VARCHAR(20) DEFAULT 'new',
    reply         TEXT,
    replied_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_message_type ON message(type);
CREATE INDEX ix_message_ref_id ON message(ref_id);
CREATE INDEX ix_message_status ON message(status);
CREATE INDEX ix_message_created_at ON message(created_at);

CREATE TABLE banner (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    image         VARCHAR(512) NOT NULL,
    link_url      VARCHAR(512),
    sort_order    INTEGER DEFAULT 0,
    status        VARCHAR(20) DEFAULT 'active',
    start_time    TIMESTAMPTZ,
    end_time      TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_banner_status ON banner(status);

-- ============ 关于我们配置 ============
CREATE TABLE company_info (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(200) DEFAULT 'Rz家居',
    logo_url      VARCHAR(512),
    founded_year  INTEGER,
    honor_count   INTEGER,
    production_line_count INTEGER,
    address       VARCHAR(300),
    phone         VARCHAR(40),
    email         VARCHAR(160),
    wechat        VARCHAR(80),
    icp_no        VARCHAR(40),
    intro         TEXT,
    updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE about_section (
    id            SERIAL PRIMARY KEY,
    code          VARCHAR(20) NOT NULL,
    title         VARCHAR(200) NOT NULL,
    content       TEXT,
    cover_image   VARCHAR(512),
    sort_order    INTEGER DEFAULT 0,
    status        VARCHAR(20) DEFAULT 'active',
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_about_section_code ON about_section(code);
CREATE INDEX ix_about_section_status ON about_section(status);

CREATE TABLE milestone (
    id            SERIAL PRIMARY KEY,
    year          VARCHAR(20) NOT NULL,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    image         VARCHAR(512),
    sort_order    INTEGER DEFAULT 0,
    status        VARCHAR(20) DEFAULT 'active',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_milestone_status ON milestone(status);

-- ============ 权限 / 系统 ============
CREATE TABLE role (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(80) NOT NULL UNIQUE,
    permissions   JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE admin_user (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(120),
    role_id       INTEGER NOT NULL REFERENCES role(id) ON DELETE RESTRICT,
    status        VARCHAR(20) DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_admin_user_status ON admin_user(status);
CREATE INDEX ix_admin_user_role_id ON admin_user(role_id);

CREATE TABLE audit_log (
    id            BIGSERIAL PRIMARY KEY,
    admin_id      INTEGER REFERENCES admin_user(id) ON DELETE SET NULL,
    action        VARCHAR(40) NOT NULL,
    target_type   VARCHAR(40),
    target_id     INTEGER,
    detail        TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_audit_log_created_at ON audit_log(created_at);
CREATE INDEX ix_audit_log_admin_id ON audit_log(admin_id);
```

#### 4.4.2 开发环境 SQLite DDL（适配版）

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE product_series (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    description   TEXT,
    cover_image   TEXT,
    sort_order    INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'active',
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_product_series_status ON product_series(status);

CREATE TABLE category (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    parent_id     INTEGER REFERENCES category(id),
    sort_order    INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'active',
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_category_status ON category(status);
CREATE INDEX ix_category_parent_id ON category(parent_id);

CREATE TABLE product (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    series_id     INTEGER REFERENCES product_series(id),
    category_id   INTEGER REFERENCES category(id),
    name          TEXT NOT NULL,
    model_no      TEXT,
    summary       TEXT,
    description   TEXT,
    images        TEXT DEFAULT '[]',
    specs         TEXT DEFAULT '{}',
    price         REAL,
    is_recommended INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'active',
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_product_series_id ON product(series_id);
CREATE INDEX ix_product_category_id ON product(category_id);
CREATE INDEX ix_product_status ON product(status);

CREATE TABLE cases (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    category      TEXT DEFAULT '住宅',
    cover_image   TEXT,
    images        TEXT DEFAULT '[]',
    summary       TEXT,
    content       TEXT,
    is_new        INTEGER DEFAULT 0,
    sort_order    INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'active',
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_cases_category ON cases(category);
CREATE INDEX ix_cases_status ON cases(status);

CREATE TABLE news (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    category      TEXT DEFAULT 'company',
    cover_image   TEXT,
    summary       TEXT,
    content       TEXT,
    author        TEXT,
    published_at  TEXT,
    is_top        INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'draft',
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_news_category ON news(category);
CREATE INDEX ix_news_status ON news(status);

CREATE TABLE job (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    type          TEXT DEFAULT 'social',
    title         TEXT NOT NULL,
    department    TEXT,
    city          TEXT,
    salary        TEXT,
    description   TEXT,
    requirements  TEXT,
    headcount     INTEGER,
    status        TEXT DEFAULT 'active',
    publish_at    TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_job_type ON job(type);
CREATE INDEX ix_job_status ON job(status);

CREATE TABLE message (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    type          TEXT DEFAULT 'contact',
    ref_id        INTEGER REFERENCES job(id),
    name          TEXT NOT NULL,
    phone         TEXT NOT NULL,
    email         TEXT,
    content       TEXT NOT NULL,
    status        TEXT DEFAULT 'new',
    reply         TEXT,
    replied_at    TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_message_type ON message(type);
CREATE INDEX ix_message_ref_id ON message(ref_id);
CREATE INDEX ix_message_status ON message(status);
CREATE INDEX ix_message_created_at ON message(created_at);

CREATE TABLE banner (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    image         TEXT NOT NULL,
    link_url      TEXT,
    sort_order    INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'active',
    start_time    TEXT,
    end_time      TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_banner_status ON banner(status);

CREATE TABLE company_info (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT DEFAULT 'Rz家居',
    logo_url      TEXT,
    founded_year  INTEGER,
    honor_count   INTEGER,
    production_line_count INTEGER,
    address       TEXT,
    phone         TEXT,
    email         TEXT,
    wechat        TEXT,
    icp_no        TEXT,
    intro         TEXT,
    updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE about_section (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    code          TEXT NOT NULL,
    title         TEXT NOT NULL,
    content       TEXT,
    cover_image   TEXT,
    sort_order    INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'active',
    updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_about_section_code ON about_section(code);
CREATE INDEX ix_about_section_status ON about_section(status);

CREATE TABLE milestone (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    year          TEXT NOT NULL,
    title         TEXT NOT NULL,
    description   TEXT,
    image         TEXT,
    sort_order    INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'active',
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_milestone_status ON milestone(status);

CREATE TABLE role (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL UNIQUE,
    permissions   TEXT DEFAULT '{}'
);

CREATE TABLE admin_user (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name  TEXT,
    role_id       INTEGER NOT NULL REFERENCES role(id),
    status        TEXT DEFAULT 'active',
    last_login_at TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_admin_user_status ON admin_user(status);
CREATE INDEX ix_admin_user_role_id ON admin_user(role_id);

CREATE TABLE audit_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id      INTEGER REFERENCES admin_user(id),
    action        TEXT NOT NULL,
    target_type   TEXT,
    target_id     INTEGER,
    detail        TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_audit_log_created_at ON audit_log(created_at);
CREATE INDEX ix_audit_log_admin_id ON audit_log(admin_id);
```

#### 4.4.3 双库类型差异对照表

| 逻辑类型 | PostgreSQL | SQLite | 说明 |
|---|---|---|---|
| 主键自增 | `SERIAL`（高增表用 `BIGSERIAL`） | `INTEGER PRIMARY KEY AUTOINCREMENT`（64 位） | 高增表 `message`/`audit_log` 已用 `BIGSERIAL`；`product`/`job` 建议后续升 `BIGINT` |
| 短字符串 | `VARCHAR(n)` | `TEXT` | SQLite 无长度约束，应用层校验 |
| 长文本 | `TEXT` | `TEXT` | — |
| 布尔 | `BOOLEAN` | `INTEGER`（0/1） | ORM 自动映射 |
| 浮点 | `DOUBLE PRECISION` | `REAL` | — |
| JSON | `JSONB` | `TEXT`（JSON 字符串） | ORM `JSON` 类型透明处理 |
| 时间(UTC) | `TIMESTAMPTZ` | `TEXT`（ISO8601） | 应用层统一写入 UTC |
| 外键 | `REFERENCES … ON DELETE` | `REFERENCES …`（需 `PRAGMA foreign_keys=ON`） | — |

> 枚举值**不在 DB 建 CHECK**，统一在 Pydantic 校验，保证双库一致（开发技术文档 §4.3）。

#### 4.4.4 初始化 seed 数据

```sql
-- 角色（三角色权限矩阵，与开发技术文档 §7.4 一致）
-- 注意：不显式指定 id，交由 SERIAL / AUTOINCREMENT 自分配。
-- 若显式写入 id，PostgreSQL 的序列不会自动前进，后续自增插入会因主键冲突失败。
INSERT INTO role (name, permissions) VALUES
  ('super_admin', '{"*":["read","write"]}'),
  ('editor',      '{"product_series":["read","write"],"category":["read","write"],"product":["read","write"],"cases":["read","write"],"news":["read","write"],"about_section":["read","write"],"milestone":["read","write"],"banner":["read","write"],"company_info":["read","write"]}'),
  ('cs_hr',       '{"job":["read","write"],"message":["read","write"],"banner":["read"]}');

-- 默认超级管理员（首次部署请立即修改密码；password_hash 为占位，需由后端 bcrypt 生成）
-- INSERT INTO admin_user (username, password_hash, display_name, role_id, status)
-- VALUES ('admin', '<bcrypt-hash-of-your-password>', '管理员', 1, 'active');

-- 公司信息单行（首条插入 id 自然为 1，应用层保障仅此一条）
INSERT INTO company_info (name, founded_year, honor_count, production_line_count, address, phone, email, icp_no)
VALUES ('Rz家居', 1953, 200, 6, '（待填地址）', '（待填电话）', '（待填邮箱）', '（待填备案号）');
```

> 说明：`admin_user` 初始账号建议在部署流程中通过后端命令创建（避免明文密码落入 SQL），此处以注释占位。

---

#### 4.4.5 性能、安全与扩展性增强建议（v1.1 补充）

> 以下为非阻断性建议，可在 v1.1+ 迭代落地；当前 DDL 已满足 v1 上线。

**性能**
- **复合索引（高频列表）**：前台产品/新闻/案例列表常按「状态 + 分类/系列」组合过滤并分页，单列索引对组合过滤收益有限，建议补充复合索引：
  - `product`：`(status, series_id)`、`(status, category_id)`
  - `news`：`(status, category)`、`(status, is_top)`
  - `job`：`(status, type)`
  - `banner`：针对「当前生效」建**部分索引** `WHERE status='active' AND (start_time IS NULL OR start_time<=now()) AND (end_time IS NULL OR end_time>=now())`
- **搜索能力**：PRD/技术文档含前台搜索（产品/新闻）。`LIKE '%关键词%'`（前导通配）无法命中 B-tree 索引，对中文尤其低效。建议：
  - 生产 PG：对 `product.name/summary`、`news.title/content` 建 `tsvector` 全文索引（`GIN`）或 `pg_trgm` trigram 索引；
  - 开发 SQLite：启用 `FTS5` 虚拟表。
- **主键类型**：`message`、`audit_log` 为持续增长表，PG 已采用 `BIGSERIAL`（64 位）；`product`、`job` 建议后续亦升为 `BIGINT` 以防长期自增溢出。
- **审计表治理**：`audit_log` 只增不删，建议设定保留期（如 180/365 天）并定期归档；按人检索以 `(admin_id, created_at)` 复合索引加速（§6 已含 `admin_id` 单列索引）。

**安全**
- **连接与账号**：生产 PG 须 `sslmode=require`（传输加密）；应用使用**最小权限**独立账号（仅授予库表 DML，无 SUPERUSER）；禁止在代码/SQL 中硬编码凭据，统一走密钥管理。
- **PII 保护**：`message`（姓名/电话/邮箱/内容）属个人信息，遵循《个人信息保护法》：① 仅 `cs_hr` 角色可访问（已在 `role.permissions` 约束）；② 建议对 `phone`/`email` 落库做**字段级加密**或脱敏展示；③ 读取/导出留痕至 `audit_log`；④ 提供删除/导出接口以支撑数据主体权利。
- **权限矩阵单一事实源**：`role.permissions` 为自由 JSON，须与后端 `require_role(module, action)` 的**模块清单**严格一致（见附录 D）。新增模块须同步更新此处与后端常量；v2 可考虑将权限**范式化**为 `role_permission(role_id, module, action)` 表，便于数据库层强制与查询。

**扩展性**
- **`cases.category` 可配置化**：当前为固定枚举（住宅/工程/商业），新增类型需改代码；后续可抽为 `case_category` 参照表。
- **`message.ref_id` 多态关联**：当前仅关联 `job`（应聘）。若未来需「产品/案例咨询」等线索，建议演进为 `(ref_type, ref_id)` 多态或独立线索表；v1 维持单关联即可。
- **`company_info` 单行约束**：当前靠应用层保障 `id=1` 唯一。多品牌/多租户场景需重构为 `brand` 维度；v1 可接受，建议在服务层加「仅允许一条」的写保护。

---



### 4.5 索引设计汇总

| 表 | 索引列 | 用途 |
|---|---|---|
| product_series | slug(UQ), status | 唯一短链、列表过滤 |
| category | slug(UQ), status, parent_id | 自引用树、列表过滤 |
| product | series_id, category_id, status | 关联查询、空间/系列筛选 |
| cases | category, status | 分类筛选、可见性 |
| news | category, status | 企业/行业切换、草稿过滤 |
| job | type, status | 社会/校园切换、可见性 |
| message | type, ref_id, status, created_at | 联系/应聘分类、关联职位、处理状态、时间排序 |
| banner | status | 轮播可见性 |
| about_section | code, status | 区块定位、可见性 |
| milestone | status | 时间轴可见性 |
| admin_user | username(UQ), status, role_id | 登录查询、账号状态、按角色筛选 |
| audit_log | created_at, admin_id | 审计时间检索、按操作人检索 |

---



### 4.6 迁移与版本管理

#### 4.6.1 迁移工具
- 使用 **Alembic** 管理版本化迁移；`models/` 为 SQLAlchemy 2.0 声明式模型（见开发技术文档 §4.2）。
- 迁移脚本同时兼容双库：避免方言原生 SQL，统一用 `op.*` 跨库 API。

#### 4.6.2 双库校验
- **本地/单测**：使用 SQLite，运行 `alembic upgrade head` 验证迁移可落地。
- **CI 集成测试**：使用 PostgreSQL 容器，运行同一套迁移，验证 `JSONB`/`TIMESTAMPTZ` 等类型正确。
- 禁止在迁移中写 `server_default=now()` 之外的数据库函数差异逻辑；时间默认统一在应用层赋值。

#### 4.6.3 初始化顺序
1. 建表（§5.1 / §5.2）→ 2. 建索引 → 3. 插入 `role` 三行 → 4. 插入 `company_info`(id=1) → 5. （可选）通过后端命令创建首个 `admin_user`。
6. `audit_log` 等表建表留空，运行期写入。

#### 4.6.4 回滚
- 每个 Alembic 版本提供 `downgrade()`；生产回滚前先备份（尤其含数据迁移时）。

---



### 4.7 附录

#### 4.7.A 枚举取值总表

| 实体 | 字段 | 取值 |
|---|---|---|
| product_series / category / product / cases / banner / about_section / milestone | status | active \| hidden |
| news | status | draft \| published |
| job | status | active \| hidden |
| job | type | social \| campus |
| news | category | company \| industry |
| cases | category | 住宅 \| 工程 \| 商业 |
| message | type | contact \| job_application |
| message | status | new \| handled \| ignored |
| admin_user | status | active \| disabled |
| role | name | super_admin \| editor \| cs_hr |
| about_section | code | overview \| brand |
| audit_log | action | create \| update \| delete \| login |

#### 4.7.B 命名规范速查
- 表名/字段：`snake_case` 单数；外键 `<表>_id`；布尔 `is_`；时间 `created_at`/`updated_at`。
- 案例表名 `cases`（避 `case` 关键字）；公司信息单行约定 `id=1`。

#### 4.7.C 常见查询示例

```sql
-- 前台：可见产品列表（按系列+空间筛选，分页）
SELECT id, name, summary, cover_image, price
FROM product
WHERE status = 'active'
  AND (series_id = :series OR :series IS NULL)
  AND (category_id = :cat OR :cat IS NULL)
ORDER BY is_recommended DESC, created_at DESC
LIMIT :size OFFSET :offset;

-- 后台：应聘留言 + 关联职位标题
SELECT m.id, m.name, m.phone, m.content, m.status, j.title AS job_title
FROM message m
LEFT JOIN job j ON m.ref_id = j.id
WHERE m.type = 'job_application'
ORDER BY m.created_at DESC;

-- 关于我们：取 overview / brand 区块
SELECT code, title, content, cover_image
FROM about_section
WHERE status = 'active' AND code IN ('overview','brand')
ORDER BY sort_order;
```

#### 4.7.D 权限模块规范枚举（与 role.permissions 键一致）

| 模块 key | 含义 | 默认可写角色 |
|---|---|---|
| product_series | 产品系列 | editor |
| category | 空间分类 | editor |
| product | 产品 | editor |
| cases | 案例 | editor |
| news | 新闻 | editor |
| job | 招聘职位 | cs_hr |
| message | 留言/线索 | cs_hr |
| banner | 轮播图 | editor（写）/ cs_hr（读） |
| about_section | 关于我们区块 | editor |
| milestone | 发展历程 | editor |
| company_info | 公司信息 | editor |
| admin_user | 管理员 | super_admin |
| role | 角色 | super_admin |
| audit_log | 审计日志 | super_admin |

> 后端 `require_role(module, action)` 的 `module` 取值须与上述 key 完全一致；`role.permissions` 形如 `{"product":["read","write"]}`，`"*"` 表示全模块。

---

> 本文档与 `PRD_企业家居网站.md`(v0.5)、`开发技术文档_Rz家居网站.md`(v1.2) 完全对齐：14 张表、`message.type` 双类型 + `ref_id` 关联职位、三张配置表、三角色权限边界均一致。E-R 图由「架构图与流程图绘制专家」技能生成（Mermaid → SVG）。


## 5. 后端接口详细设计

### 5.1 统一响应信封
```json
// 成功
{ "code": 0, "message": "ok", "data": { }, "request_id": "uuid" }
// 分页列表
{ "code": 0, "message": "ok",
  "data": { "items": [ ], "page": 1, "page_size": 10, "total": 53 }, "request_id": "uuid" }
// 失败
{ "code": 1001, "message": "参数校验失败", "detail": {"field":"phone","issue":"格式不正确"}, "request_id": "uuid" }
```
- HTTP 状态码与业务 `code` 配合（见 §5.3）。

### 5.2 鉴权流程（JWT）
1. `POST /api/admin/login`：校验账号密码（bcrypt）→ 返回 `access_token`（30 min）+ `refresh_token`（7 d）。
2. 管理接口请求头：`Authorization: Bearer <access_token>`；依赖 `get_current_admin` 解析并校验角色。
3. 过期：`access_token` 失效返回 401（`code=2002`）；前端用 `refresh_token` 调 `POST /api/admin/refresh` 换新；`refresh` 也失效则跳登录。
4. `POST /api/admin/logout`：将 `refresh_token` 加入吊销列表（Redis 或 DB 表），使其无法再换发。



> 下图由「架构图与流程图绘制专家」技能生成（Mermaid 时序图）。

```mermaid
sequenceDiagram
    autonumber
    participant C as 前端
    participant A as FastAPI
    participant D as 数据库
    participant R as Redis(可选)

    C->>A: POST /api/admin/login {username,password}
    A->>D: 校验账号密码(bcrypt)
    alt 登录成功
        A-->>C: 200 {access_token, refresh_token}
        C->>A: 携带 Authorization: Bearer access_token
        A->>A: 解析 JWT + require_role 校验
        A-->>C: 受保护接口数据
        Note over C,A: access_token 约 30min 过期
        C->>A: 401 -> POST /api/admin/refresh {refresh_token}
        A->>R: 校验 refresh_token 未吊销
        A-->>C: 200 {access_token}
    else 登录失败 / refresh 失效
        A-->>C: 401(2001/2005) -> 跳登录
    end
    C->>A: POST /api/admin/logout {refresh_token}
    A->>R: 加入吊销名单
```

### 5.3 错误码表
| code | HTTP | 含义 |
| --- | --- | --- |
| 0 | 200/201 | 成功 |
| 1001 | 422/400 | 参数校验失败 |
| 1002 | 400 | 必填缺失 |
| 1003 | 400 | 格式错误（手机/邮箱/URL） |
| 2001 | 401 | 账号或密码错误 |
| 2002 | 401 | AccessToken 过期 |
| 2003 | 401 | Token 无效/缺失 |
| 2004 | 403 | 无权限（角色不符） |
| 2005 | 401 | RefreshToken 失效/已吊销 |
| 3001 | 404 | 资源不存在 |
| 3002 | 409 | 资源已存在（如用户名重复） |
| 429 | 429 | 请求过于频繁（限频） |
| 5000 | 500 | 服务器内部错误 |

### 5.4 公开接口（无需鉴权）
> 通用列表参数：`page`(默认1)、`page_size`(默认10，最大50)。响应 `data` 含 `items/page/page_size/total`。

| 方法 | 路径 | 查询/路径参数 | 响应 data | 备注 |
| --- | --- | --- | --- | --- |
| GET | /api/home/overview | — | `{banners, recommended_products, latest_cases, latest_news, company_stats}` | 聚合首屏；`company_stats` 缺失则为 null（前端不渲染该块） |
| GET | /api/series | — | `items:[{id,name,slug,cover_image,product_count}]` | |
| GET | /api/products | `series_id?,category_id?,keyword?,page,page_size` | `items:[ProductPublic]` | `hidden` 不返回 |
| GET | /api/products/{id} | — | `ProductDetail` | `hidden` → 404(`3001`) |
| GET | /api/cases | `category?(住宅/工程/商业),page,page_size` | `items:[CasePublic]` | `hidden` 不返回；`is_new` 优先 |
| GET | /api/cases/{id} | — | `CaseDetail` | `hidden` → 404 |
| GET | /api/news | `category?(company/industry),page,page_size` | `items:[NewsPublic]` | 仅 `published`；置顶优先 |
| GET | /api/news/{id} | — | `NewsDetail` | 草稿 → 404 |
| GET | /api/about/overview | — | `{company_info, overview_section}` | overview_section=about_section[code=overview] |
| GET | /api/about/history | — | `{items:[Milestone]}` | 仅 `active` |
| GET | /api/about/brand | — | `{brand_section}` | about_section[code=brand] |
| GET | /api/contact/info | — | `company_info` 联系字段子集 | |
| GET | /api/jobs | `type?(social/campus),page,page_size` | `items:[JobPublic]` | 仅 `active` |
| GET | /api/jobs/{id} | — | `JobDetail` | `hidden` → 404 |
| GET | /api/banners | — | `items:[Banner]` | 仅生效且未过期 |
| POST | /api/inquiries | body(JSON) | `{id}` | 见 5.5 |

**ProductPublic 字段**：`id,name,model_no,summary,cover_image,price,is_recommended,series_name,category_name`。
**ProductDetail**：ProductPublic + `images,specs(定义列表),description(富文本),series,category`。

### 5.5 提交留言 `POST /api/inquiries`
请求体：
```json
{
  "type": "contact",            // contact | job_application
  "job_id": null,               // type=job_application 时必填且有效
  "name": "张三",               // 必填
  "phone": "13800000000",       // 必填，正则校验
  "email": "a@b.com",           // 可选，格式校验
  "content": "咨询沙发"          // 必填
}
```
- 校验：`name/phone/content` 必填；`phone` 中国大陆手机号正则；`type=job_application` 时 `job_id` 必须对应存在的 `active` 职位（否则 `3001`）。
- 限频：单 IP `POST /api/inquiries` 限 10 次/分钟（P1 加图形验证码）。
- 响应：`{code:0, data:{id:123}}`，落库 `message`（`status=new`）。

### 5.6 管理接口（JWT 必需，按角色授权）
> 通用 CRUD：`GET`(列表，支持 `page/page_size`+筛选)、`POST`(新增)、`PUT /{id}`(全量更新)、`DELETE /{id}`(删除)。响应 `data` 为对象或 `{id}`。

| 方法 | 路径 | 角色 | 关键字段（POST/PUT body） |
| --- | --- | --- | --- |
| POST | /api/admin/login | 公开 | `{username,password}` → `{access_token,refresh_token,admin:{id,username,role,display_name}}` |
| POST | /api/admin/refresh | 公开(RefreshToken) | `{refresh_token}` → `{access_token}` |
| POST | /api/admin/logout | 登录 | `{refresh_token}` → ok |
| GET | /api/admin/me | 登录 | 当前管理员 + 角色权限 |
| GET/POST/PUT/DELETE | /api/admin/series | editor/super | name,slug,description,cover_image,sort_order,status |
| GET/POST/PUT/DELETE | /api/admin/categories | editor/super | name,slug,parent_id,sort_order,status |
| GET/POST/PUT/DELETE | /api/admin/products | editor/super | 见 4.2 Product 字段；图片经 `/upload` 先传 |
| GET/POST/PUT/DELETE | /api/admin/cases | editor/super | title,category,cover_image,images,summary,content,is_new,sort_order,status |
| GET/POST/PUT/DELETE | /api/admin/news | editor/super | title,category,cover_image,summary,content,author,published_at,is_top,status |
| GET/POST/PUT/DELETE | /api/admin/jobs | cs_hr/super | type,title,department,city,salary,description,requirements,headcount,status,publish_at |
| GET | /api/admin/messages | cs_hr/super | 列表，筛选 `type`(contact/job_application)、`status`(new/handled/ignored)；应聘项含 `job_title` |
| PUT | /api/admin/messages/{id} | cs_hr/super | `{status?,reply?}` → 更新状态/回复，`replied_at` 自动 |
| GET/POST/PUT/DELETE | /api/admin/banners | editor/super | title,image,link_url,sort_order,status,start_time,end_time |
| GET/PUT | /api/admin/company-info | editor/super | 单行编辑（见 4.2 CompanyInfo） |
| GET/POST/PUT/DELETE | /api/admin/about-sections | editor/super | code(overview/brand),title,content,cover_image,sort_order,status |
| GET/POST/PUT/DELETE | /api/admin/milestones | editor/super | year,title,description,image,sort_order,status |
| POST | /api/admin/upload | 登录 | `multipart/form-data file` → `{url, name}` |
| GET/POST/PUT/DELETE | /api/admin/admins | super | username,display_name,role_id,password(新增),status |
| GET/POST/PUT/DELETE | /api/admin/roles | super | name,permissions(JSON) |
| GET | /api/admin/stats/overview | 登录 | 计数 + 近30天留言趋势 |

**角色授权矩阵**（依赖 `require_role`）：
- `super_admin`：全部。
- `editor`：series/categories/products/cases/news/banners/company-info/about-sections/milestones/me/upload。
- `cs_hr`：jobs/messages/me/upload + stats 概览。
- 越权访问 → 403(`2004`)。

**上传 `POST /api/admin/upload`**：接收图片/文件，落 `static/uploads/`（或对象存储），返回可访问 URL（如 `/uploads/2026/08/abc.jpg` 或 CDN 域名）。生产建议对象存储 + CDN。

### 5.7 接口示例（curl）
```bash
# 登录
curl -X POST http://localhost:8000/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin@123"}'

# 获取产品列表（公开）
curl http://localhost:8000/api/products?series_id=1&page=1&page_size=10

# 提交应聘留言（公开）
curl -X POST http://localhost:8000/api/inquiries \
  -H 'Content-Type: application/json' \
  -d '{"type":"job_application","job_id":7,"name":"李四","phone":"13900000000","content":"应聘设计师"}'
```

---

## 6. 前台官网（React + Tailwind）开发设计

### 6.0 前台模块架构图（由「架构图与流程图绘制专家」技能生成，SVG）

![前台模块架构图](./assets/frontend_modules.svg)

> 前台官网采用「页面模块 → 公共/UI 层 → 数据/服务层 → 后端 API」三层结构；前台为匿名访客，三角色权限仅作用于后台系统。

### 6.1 路由（对齐 UI/UX 7.1）
```
/                    首页
/products            产品中心（列表+筛选）
/products/:id        产品详情
/cases               新案例展示
/cases/:id           案例详情
/news                新闻（Tab: 企业新闻/行业资讯）
/news/:id            新闻详情
/jobs                招聘入口（Tab: 社会/校园）
/jobs/:id            职位详情（含投递意向）
/about               关于Rz
/about/history       发展历程
/about/brand         品牌介绍
/about/contact       联系我们（含留言表单）
/404                 品牌化 404
```

### 6.2 目录
```
frontend/web/src/
├─ main.tsx / App.tsx       # 路由挂载
├─ pages/                   # 上述各路由页
├─ components/              # 顶部导航(对齐 prototype_topnav)、页脚、轮播、产品卡、案例卡、新闻卡、职位卡、表单、Toast、骨架屏、空态、404
├─ api/                     # 各资源请求封装（基于 axios 实例）
├─ store/                   # Zustand：全局 UI 态（移动抽屉、Toast 队列）
├─ hooks/                   # useProductList、useInquiry 等
├─ styles/                  # tailwind 配置 + index.css（注入 UI/UX 2.2 CSS 变量）
└─ utils/                   # 校验、格式化、SEO(meta)
```

### 6.3 设计令牌落地（UI/UX 2.2）
- `tailwind.config` 注入 `cream/walnut/walnut-d/sand/ink/muted/line`；字体 `Noto Serif SC`(标题)/`Noto Sans SC`(正文)。
- `index.css` 注入 `:root` CSS 变量（见 UI/UX 2.2）与语义色（success/warning/danger）。
- 图标一律 SVG（Lucide），禁 emoji；焦点环 `focus-visible:ring-2 ring-walnut/40`。

### 6.4 状态与请求
- Axios 实例 `baseURL=/api`；响应拦截器拆 `data`、统一错误 Toast；401 触发 refresh 流程（§5.2）→ 失败跳登录。
- 列表页用 `useSWR` 或自写 `useList`（含 `page/page_size/total` 状态）。

### 6.5 关键交互（对照 PRD/UI/UX）
- 顶部导航：桌面 hover/focus 弹二级（200ms 淡入+上移）；移动 `<lg` 汉堡抽屉 + 二级手风琴（对齐 `prototype_topnav.html`）。
- 轮播：自动播放 + 指示点 + 箭头，键盘可达，`prefers-reduced-motion` 关闭动画。
- 产品/案例/新闻筛选 + 分页；`hidden`/`draft` 内容前台不可见（由后端保证）。
- 投递意向 / 联系表单：必填校验（姓名*、电话*、内容*），提交 `POST /api/inquiries`，loading 禁用按钮，成功 Toast，失败就近红字。
- 响应式：主断点 375/768/1024/1440；卡片比例（产品 4:3、案例 16:9、新闻 3:2）`object-cover`。

### 6.6 SEO 基础（P1）
- 每页 `title`/`description`（React Helmet / 路由 meta）；语义标签 `header/nav/main/footer`；`sitemap.xml` 与 `robots.txt` 由后端或构建生成；静态可索引。

### 6.7 无障碍
- 焦点环、键盘可达（Tab 顺序=视觉）、`img alt`、表单 `label[for]`、`aria-*`、状态不只靠颜色（错误同时图标+文字）、`prefers-reduced-motion`。

---

## 7. 后台管理系统（React + Ant Design）前端设计

### 7.0 后台模块架构图（由「架构图与流程图绘制专家」技能生成，SVG）

![后台模块架构图](./assets/backend_modules.svg)

> 后台管理系统采用「页面模块（登录 + 三角色）→ 公共层（布局/角色菜单/路由守卫/AntD 主题/通用 CRUD）→ 数据层 → 后端 API」结构；菜单与接口按角色（超管/编辑/客服HR）过滤。

### 7.1 路由与布局
```
/login                      登录
/dashboard                  控制台（概览）
/content/series             产品系列
/content/categories         产品分类
/content/products           产品
/content/cases              案例
/content/news               新闻
/content/about              关于我们配置（公司信息/区块/历程 三子页）
/recruit/jobs               招聘职位
/interaction/messages       留言管理
/display/banners            轮播
/system/admins              管理员
/system/roles               角色与权限
```
- 布局：左侧固定 `Sider`（Logo+菜单树，可折叠）+ 顶部 `Header`（面包屑、当前管理员、退出）+ 内容区 `max-w-[1440px]`。
- 菜单按角色过滤（§5.6 矩阵）；越权路由重定向提示。

### 7.2 AntD 主题（UI/UX 2.2）
```ts
export const adminTheme = {
  token: { colorPrimary:'#6B4F3A', colorLink:'#6B4F3A',
           fontFamily:'"Noto Sans SC", system-ui, sans-serif',
           borderRadius:8, colorBgLayout:'#FAF7F2' },
};
```
- 圆角 `md`、阴影克制、语义色 success/warning/danger 注入。

### 7.3 通用 CRUD 模式（提升一致性与效率）
- 列表页：AntD `Table` + 筛选条（状态/类型/关键词）+ 分页 + 批量操作（上下架/删除，带 `Popconfirm`）。
- 表单：右侧 `Drawer` 滑入，字段 + 富文本（Tiptap）+ 图片上传（走 `/api/admin/upload` 返回 URL 显示缩略图）+ 必填校验 + 提交 loading + 成功 Toast 关闭。
- 详情：`Drawer` 只读展示 + 编辑/删除按钮。
- 删除/下架：`Popconfirm` 或 `Modal` 二次确认（危险色）。

### 7.4 三角色界面差异（UI/UX 4.10）
| 角色 | 可见菜单 | 边界 |
| --- | --- | --- |
| 超级管理员 | 全部 | 含账号、角色、统计 |
| 内容编辑 | 控制台、内容管理(系列/分类/产品/案例/新闻/关于我们)、轮播 | 展示型 CRUD；无招聘/留言/系统 |
| 客服/HR | 控制台(概览)、招聘、留言 | 线索型；无其他内容/系统 |

### 7.5 富文本与上传
- Tiptap 输出 HTML，前端做基础约束（图片大小/格式），提交后端净化（§8.4）。
- 上传组件统一封装 `UploadToAdmin`，成功后回填 URL 字段。

---

## 8. 前后端联调约定

1. **API 基址**：前端 `baseURL=/api`；开发 Vite 代理到 `:8000`，生产 Nginx 统一反代，规避 CORS。
2. **响应信封**：前端只消费 `data`；非 0 `code` 统一 Toast（`message` 字段），`detail` 用于表单就近错误。
3. **分页参数**：`page`(从1)、`page_size`；响应 `data.{items,page,page_size,total}`。
4. **时间格式**：统一 ISO8601 UTC（如 `2026-08-17T03:24:00Z`）；前端按本地时区展示，写回用 UTC。
5. **富文本存储**：Tiptap HTML → 后端 `bleach`/`sanitize`（白名单标签与属性，去 `<script>`/`on*`）→ 存库；返回时原样渲染（前端信任已净化内容，仍建议 CSP）。
6. **文件 URL**：上传返回相对或绝对 URL；前端 `alt` 必填，`object-cover` 比例统一。
7. **CORS**：开发 `allow_origins=[localhost:5173]`；生产关闭跨域或仅放行自有域名。
8. **401/Refresh**：响应拦截器捕获 401 → 用 `refresh_token` 调 `/refresh` → 重试原请求；refresh 失败清态跳登录。
9. **错误码**：前端维护 `code→文案` 映射（§5.3），未知错误归为"服务异常，请稍后重试"。

---

## 9. 安全与合规实现要点

1. **传输安全**：全站 HTTPS（Nginx 终止）；HSTS。
2. **鉴权**：JWT Access(30 min)+Refresh(7 d)；bcrypt 加盐（cost≥12）；RefreshToken 可吊销（Redis 黑名单或 DB 表）。
3. **授权**：每个管理接口经 `require_role` 校验（§5.6）；前端菜单/路由双重防护（后端为准）。
4. **防刷**：`POST /api/inquiries` 单 IP 限频（10/min）；P1 加图形验证码（服务商待定）。
5. **合规（个保法）**：留言仅收集必要字段（姓名/电话/内容），明示用途与隐私政策链接（P1 页）；不明文日志敏感信息；数据最小化。
6. **审计（P1）**：关键写操作（增删改/登录/权限变更）写 `audit_log`。
7. **依赖安全**：定期 `pip-audit` / `npm audit`；锁版本。
8. **内容安全**：富文本净化 + 响应头 `Content-Security-Policy`。

---

## 10. 开发任务拆解与排期（映射 PRD M1–M5）

| 阶段 | 主要任务（粒度） | 依赖 |
| --- | --- | --- |
| M1 设计/选型(第1周) | 确认技术栈（已定）；定 API 契约（本文 §5）；定 Tailwind/AntD 主题；搭建 Monorepo 骨架 | — |
| M2 后端基础(第2–3周) | FastAPI 脚手架；SQLAlchemy 模型(14)；Alembic 双库迁移+seed；JWT 登录/刷新/登出；上传；公开接口(16)；管理接口(22)；统计；限频预留 | M1 |
| M3 前台官网(第3–5.5周) | 框架(导航/页脚/响应式)；首页聚合；产品中心+详情；案例；新闻；招聘+投递；关于我们四页；留言表单；SEO/无障碍 | M2 |
| M4 后台(第5.5–7.5周) | 登录+三角色路由；控制台；内容(系列/分类/产品/案例/新闻/关于我们)；招聘；留言；轮播；系统(管理员/角色)；统计；通用 CRUD/抽屉/确认/Toast | M2 |
| M5 测试上线(第7.5–9周) | 联调；单测(SQLite)+集成(PG)；安全/性能；Docker 部署；运营培训 | M3,M4 |

> 估时为参考，实际以评审后计划为准。每个接口/页面/模块建议拆为独立可验收任务并关联 PRD 功能点。

---

## 11. 测试策略

| 层 | 工具 | 范围 |
| --- | --- | --- |
| 后端单元 | pytest + FastAPI TestClient | 模型校验、鉴权、服务逻辑、限频 |
| 后端集成 | pytest（SQLite 单测 / PG CI） | 全接口 happy path + 边界（404/403/422/429） |
| 前端单元 | Vitest + RTL | 组件渲染、表单校验、拦截器 |
| E2E | Playwright | 关键流：首页→产品详情、招聘→投递、后台登录→CRUD→登出 |
| 性能 | 压测（后端 P95<500ms 目标） | 列表/首页聚合接口 |
| 安全 | 依赖审计 + 手动鉴权越权校验 | 角色边界、限频、净化 |

- 覆盖率门槛：后端接口 100% 可达路径；关键业务（留言、鉴权）必测。
- CI 门禁：lint + 测试通过方可合 `main`。

---

## 12. 附录

### 12.1 枚举取值总表
| 实体 | 字段 | 取值 |
| --- | --- | --- |
| product/category/banner/about_section/milestone | status | active / hidden |
| news | status | draft / published |
| news | category | company / industry |
| job | type | social / campus |
| job | status | active / hidden |
| message | type | contact / job_application |
| message | status | new / handled / ignored |
| case | category | 住宅 / 工程 / 商业 |
| role | name | super_admin / editor / cs_hr |
| admin_user | status | active / disabled |
| about_section | code | overview / brand |

### 12.2 业务错误码
见 §5.3（1001/1002/1003/2001–2005/3001/3002/429/5000）。

### 12.3 示例 curl
见 §5.7（登录、产品列表、提交应聘留言）；其余端点同构，按 §5.4/§5.6 参数替换即可。

### 12.4 环境变量清单
| 变量 | 环境 | 说明 |
| --- | --- | --- |
| DATABASE_URL | prod | `postgresql+psycopg://user:pwd@host:5432/rz_home` |
| SQLITE_URL | dev | `sqlite:///./rz_home.db` |
| SECRET_KEY | 全部 | JWT 签名密钥（强随机，保密） |
| ACCESS_TOKEN_EXPIRE_MIN | 全部 | 默认 30 |
| REFRESH_TOKEN_EXPIRE_DAYS | 全部 | 默认 7 |
| REDIS_URL | prod(可选) | RefreshToken 吊销存储；缺省落库 |
| UPLOAD_DIR | 全部 | 上传目录，默认 `app/static/uploads` |
| CORS_ORIGINS | dev | `http://localhost:5173` |
| RATE_LIMIT_PER_MIN | 全部 | 留言限频，默认 10 |

### 12.5 第三方依赖清单（核心）
- 后端：fastapi, uvicorn, sqlalchemy, alembic, pydantic, python-jose, passlib[bcrypt], python-multipart, Pillow(图片处理), bleach(净化), redis(可选), psycopg(生产)。
- 前端(web)：react, react-dom, react-router-dom, axios, zustand, @tiptap/*, tailwindcss, lucide-react。
- 前端(admin)：react, react-dom, react-router-dom, axios, antd, @ant-design/icons, @tiptap/*, lucide-react。
- 基础设施：docker, docker-compose, nginx, github-actions。

### 12.6 OpenAPI 约定
- 路由按 `tags` 分组（Public / Admin）；Pydantic `Example` 提供示例；`/docs` 即接口文档源；生产可关闭或加鉴权访问。

---

> 本文档为开发技术设计，**含示意骨架片段但不含可运行全量代码**。实现时以本文接口契约、数据模型、联调约定为准，并随评审结论更新版本。
