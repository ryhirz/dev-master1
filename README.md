# Rz 智能家居 · 全屋智能整装系统

[![CI](https://github.com/ryhirz/dev-master1/actions/workflows/ci.yml/badge.svg)](https://github.com/ryhirz/dev-master1/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

高端全屋智能家居企业官网 + 运营管理后台的完整全栈实现。访客在前台浏览产品、案例与新闻，提交留言与简历投递；管理员在后台完成内容、产品、招聘、留言的日常运营，操作全程留痕可审计。

> 采用**文档驱动开发**：需求（PRD）→ 设计（UI/UX）→ 接口契约 → 数据模型 → 代码实现，逐层约束，实现以文档为准。

---

## 仓库结构

本仓库同时承载「文档 → 原型 → 代码」三层交付物，三者一一对应：

| 目录 | 内容 |
| --- | --- |
| `文档/` | PRD、UI/UX 规范、开发技术文档、数据库设计文档、运行说明、实施方案 —— 需求与设计的权威来源 |
| `原型/` | 前台、后台、顶部导航三个可交互 HTML 原型 —— 编码前的界面验证 |
| `rz-home/` | 可运行的全栈代码（详见下文） |

## 技术栈

| 层 | 选型 |
| --- | --- |
| 后端 | Python 3.13 · FastAPI 0.115 · SQLAlchemy 2.0 · Pydantic v2 · Alembic · JWT · bcrypt |
| 前台 | Vite 5 · React 18 · TypeScript · Tailwind CSS 3 · React Router |
| 后台 | Vite 5 · React 18 · TypeScript · Ant Design 5 · Tiptap 富文本 · Vitest |
| 数据 | Dev：SQLite ｜ Prod：PostgreSQL 16 + Redis 7（docker compose） |
| 测试 | pytest（后端）· Vitest（后台）· GitHub Actions |

**双库可移植**：同一套 ORM 模型与 Alembic 迁移同时适配 SQLite 与 PostgreSQL，切换仅需修改 `DATABASE_URL`，业务代码零改动。

## 功能概览

**前台官网（14 页）**：首页聚合、产品系列与分类筛选、产品详情（富文本描述 + 规格参数）、案例展示、新闻资讯、关于我们（里程碑 / 品牌理念）、招聘、联系我们（地图定位）、留言提交。

**后台管理（11 个模块）**：登录鉴权、数据概览、产品 / 系列 / 分类管理、案例、新闻、轮播、关于我们、招聘、留言、管理员与角色、审计日志。

- 三角色权限矩阵：`super_admin` / `editor` / `cs_hr`
- 统一响应信封 `{code, message, data, request_id}`，`code = 0` 表示成功
- 鉴权：JWT（access 30 分钟 + refresh 7 天），密码 BCrypt 哈希
- 留言提交限频 10 次 / 分钟；富文本入库前经 XSS 净化
- 业务表统一带 `created_at` / `updated_at`；`audit_log` 为追加型审计表（设计上不可变，故仅有 `created_at`）

## 数据与接口规模

- **14 张表**：目录 3（`product_series` / `category` / `product`）· 内容 6（`cases` / `news` / `banner` / `about_section` / `milestone` / `company_info`）· CRM 2（`job` / `message`）· 系统 3（`role` / `admin_user` / `audit_log`）
- **82 个接口**：公开 17 + 后台 65
- 内置种子数据：产品 30 款（含智能协议 / 控制方式规格，图片全部本地化）、案例 8、新闻 6、轮播 3、系列 5、分类 4、里程碑 5、招聘 6、内置图片 28 张

## 快速开始

### 一键启动（Windows）

```powershell
cd rz-home
powershell -ExecutionPolicy Bypass -File start.ps1
```

脚本会自动检查后端虚拟环境、按需构建后台，然后同时拉起后端 `:8000`、前台 `:5173`、后台 `:5174`。

### 手动启动

**后端**

```bash
cd rz-home/backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt      # macOS / Linux: venv/bin/pip
copy .env.example .env                            # 按需修改
alembic upgrade head                              # 建表
uvicorn app.main:app --reload --port 8000
```

- 接口文档：http://localhost:8000/docs
- 冒烟测试：`pytest -q`

**前台 / 后台**

```bash
cd rz-home/frontend/web
npm install && npm run dev                        # http://localhost:5173

cd rz-home/frontend/admin
npm install --legacy-peer-deps && npm run dev     # http://localhost:5174
```

> 后台依赖 Ant Design 5 + React 18，npm 严格 peer 校验下需加 `--legacy-peer-deps`。

默认管理员账号：`admin` / `admin123`（仅用于本地开发，投产前必须修改）。

## 质量与验证

| 项 | 现状 |
| --- | --- |
| 后端单元测试 | `pytest` —— 60 个用例通过（2 个 PG 集成用例在无 PG 环境自动跳过） |
| 后台单元测试 | `vitest` |
| 类型检查 | 前台、后台 `tsc --noEmit` 均零错误 |
| 联调回归 | `backend/scripts/m4_check.py` —— 23/23 通过 |
| 持续集成 | GitHub Actions：后端 pytest + PostgreSQL 迁移集成、前后端 typecheck / build（配置见 `.github/workflows/ci.yml`） |

测试覆盖的关键行为：登录鉴权与令牌刷新、三角色权限矩阵、各资源 CRUD、公开接口、留言限频、图片上传校验、富文本 XSS 净化。

## 文档索引

| 文档 | 内容 |
| --- | --- |
| `文档/PRD_企业家居网站.md` | 需求范围、用户角色、功能清单 |
| `文档/UIUX_Rz家居网站.md` | 设计系统、页面结构与交互规范 |
| `文档/开发技术文档_Rz家居网站.md` | 技术架构、接口契约、数据模型 |
| `文档/数据库设计文档_Rz家居网站.md` | 建表语句与字段字典 |
| `文档/运行说明.md` | 环境要求与运行步骤 |
| `文档/项目开发实施方案.md` | 里程碑拆分与实施计划 |
| `rz-home/docs/交付文档.md` | 项目总览：架构 / 数据 / 接口 / 页面 / 部署 / 质量，适合作为二次开发入口 |

**文档权威性**：PRD ＞ UI/UX ＞ 开发技术文档 ＞ 数据库设计文档 ＞ 运行说明。出现分歧时以此优先级裁定。

## 开发进度

按 M1–M6 里程碑推进，功能开发与审核修正已完成，当前处于交付评审阶段。

| 阶段 | 内容 |
| --- | --- |
| M1 | 脚手架：目录结构、技术栈、API 契约、前后台路由表冻结 |
| M2–M4 | 数据层 14 模型 + Alembic 迁移 + 幂等种子；公开接口实现；前后台联调 |
| M5 | 鉴权、三角色权限矩阵、全量 CRUD、图片上传、留言限频、XSS 净化 |
| M6 | 产品定位升级为「高端全屋智能家居」；富文本编辑、种子图片本地化、界面打磨 |

各阶段详细记录见 `rz-home/docs/M1_SUMMARY.md` ～ `rz-home/docs/M6_智能家居升级说明.md`。

## 说明

- 本项目为课程交付项目，`文档/` 与 `原型/` 属交付要求的一部分，与 `rz-home/` 代码同步维护。
- 仓库当前未声明开源许可证（未附 `LICENSE`）。
