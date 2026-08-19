# M1 阶段交付总结 · 设计/脚手架

> 日期：2026-08-19
> 项目：Rz家居 全栈（rz-home）— FastAPI + React 18 + TS + Vite
> 状态：✅ 脚手架完成，待后台依赖安装完成后做启动/构建验证

## 一、已交付内容

### 1. Monorepo 目录（E:\workspace\master1\rz-home）
```
rz-home/
├─ backend/        FastAPI 后端（app: core/models/schemas/routers/deps/services + alembic + tests）
├─ frontend/web/   前台官网（Vite + React + TS + Tailwind，14 页面桩 + 主框架）
├─ frontend/admin/ 后台管理（Vite + React + TS + Ant Design 5，14 页面桩 + Sider 布局）
├─ docs/           API_CONTRACT.md（接口契约冻结版）
├─ docker-compose.yml + backend/Dockerfile
└─ .github/workflows/ci.yml
```

### 2. 技术栈冻结（已确认）
- 后端：FastAPI + Uvicorn + SQLAlchemy 2.0 + Alembic + Pydantic v2 + python-jose + passlib(bcrypt)；Dev SQLite / Prod PostgreSQL 双库可移植。
- 前台：React 18 + TS + Vite + **Tailwind CSS**（设计令牌 cream/walnut/walnut-d/sand/ink/muted/line）。
- 后台：React 18 + TS + Vite + **Ant Design 5**（colorPrimary #6B4F3A、borderRadius 8）。
- 路由：React Router v6（前后台各自 history 路由）；状态 Zustand；请求 Axios + 拦截器。

### 3. API 契约冻结（docs/API_CONTRACT.md）
- 统一信封 `{code,message,data,request_id}`；分页 `{items,page,page_size,total}`；错误码 1001–5000/429。
- 公开接口 16 项 + 管理接口（按模块 CRUD 落地，实际 65 路由；实施方案摘要"22"为模块计数，已注明）。
- 后端 `app/routers/public.py` + `admin.py` 已挂载全部接口桩（返回 501，envelope code 5000），`/docs` 可直接查看。

### 4. 前后台路由表
- 前台 14 路由：`/`、`/products`、`/products/:id`、`/cases`、`/cases/:id`、`/news`、`/news/:id`、`/jobs`、`/jobs/:id`、`/about`、`/about/history`、`/about/brand`、`/about/contact`、`*`（404）。
- 后台 14 路由：`/login`、`/dashboard`、`/content/{series,categories,products,cases,news,about}`、`/recruit/jobs`、`/interaction/messages`、`/display/banners`、`/system/{admins,roles}`、`/stats`。

### 5. 其余
- 响应信封 + 异常处理器（code 映射）、JWT/bcrypt 工具、get_db/依赖骨架、Alembic 双库环境（render_as_batch）。
- Docker 开发编排（backend + postgres + redis）、CI（pytest + 双前端 build）。

## 二、验证计划（下一步）
- 后端：`pip install -r requirements.txt` → `uvicorn app.main:app` → `GET /health` 200、`/docs` 可见、`/api/series` 501、`/api/admin/series` 401。
- 前台：`npm install` → `npm run build` 通过。
- 后台：`npm install --legacy-peer-deps` → `npm run build` 通过。

## 三、关键决策回顾（来自确认）
A. 后台 Ant Design 5 ✅  B. rz-home Monorepo ✅  C. 搜索仅 UI 占位 ✅  D. P1 纳入统计/SEO/限频 ✅
E–G 文档化假设维持：品牌素材占位、默认 admin/admin123、Docker+PG 部署脚本产出（本地 dev 优先）。
