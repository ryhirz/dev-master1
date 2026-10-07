# Rz智能家居 全栈项目（rz-home）

高端全屋智能家居企业网站：前台官网展示系统 + 后台管理系统。
技术栈：**FastAPI + React 18 + TypeScript + Vite**；前台 **Tailwind CSS**，后台 **Ant Design 5**。
数据库 **Dev SQLite / Prod PostgreSQL**（双库可移植）。

> 当前进度：**M1–M6 已完成**，功能开发与审核修正结束，处于交付评审阶段。
> 规模：14 张表 · 82 个接口（公开 17 + 后台 65）· pytest 60 通过 · 前台 14 页 · 后台 11 模块。
> 项目总览见 `docs/交付文档.md`；仓库顶层说明见 `../README.md`。

## 目录结构
```
rz-home/
├─ backend/          # FastAPI 后端（app/ 含 core/models/schemas/routers/deps/services）
│  ├─ alembic/       # 双库兼容迁移
│  └─ tests/         # pytest
├─ frontend/web/     # 前台官网（Vite + React + TS + Tailwind）
├─ frontend/admin/   # 后台管理（Vite + React + TS + Ant Design 5）
├─ docs/             # 交付文档 / 接口契约 / 部署手册 / 运营手册 / M1–M6 阶段记录
├─ docker-compose.yml
└─ start.ps1         # 一键启动（后端 + 前台 + 后台）
```

> CI 配置位于仓库根目录 `.github/workflows/ci.yml`（GitHub 仅识别仓库根下的 workflow）。

## 本地运行

### 后端
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # 按需修改
uvicorn app.main:app --reload --port 8000   # 打开 http://localhost:8000/docs
```
冒烟测试：`pytest -q`

### 前台
```bash
cd frontend/web
npm install
npm run dev                 # http://localhost:5173
```

### 后台
```bash
cd frontend/admin
npm install --legacy-peer-deps
npm run dev                 # http://localhost:5174
```
> 提示：antd v5 + React 18 安装建议加 `--legacy-peer-deps`，规避严格 peer 校验。

## 文档依据（严格对齐）
- `../文档/PRD_企业家居网站.md` — 需求与范围
- `../文档/UIUX_Rz家居网站.md` — 界面/设计系统
- `../文档/开发技术文档_Rz家居网站.md` — 接口契约 / 数据模型
- `../文档/数据库设计文档_Rz家居网站.md` — 14 表建表
- `docs/API_CONTRACT.md` — 后端接口契约（冻结）

## 交付与运维文档
- `docs/交付文档.md` — 项目总览（架构 / 数据 / 接口 / 页面 / 部署 / 质量），读完即可运行与二次开发
- `docs/M1_SUMMARY.md` ～ `docs/M6_智能家居升级说明.md` — 各阶段实施记录
- `docs/上线检查清单.md` · `docs/交付前验证.md` — 交付评审核对项
- `docs/部署手册.md` · `docs/运营手册.md` — 部署与运营说明
