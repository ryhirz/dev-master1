# Rz家居 全栈项目（rz-home）

企业家居网站：前台官网展示系统 + 后台管理系统。
技术栈：**FastAPI + React 18 + TypeScript + Vite**；前台 **Tailwind CSS**，后台 **Ant Design 5**。
数据库 **Dev SQLite / Prod PostgreSQL**（双库可移植）。

> 当前处于 **M1 脚手架阶段**：目录结构、技术栈、API 契约、前后台路由表已冻结；公开/管理接口已挂载桩（返回 501），实现见 M2–M4。

## 目录结构
```
rz-home/
├─ backend/          # FastAPI 后端（app/ 含 core/models/schemas/routers/deps/services）
│  ├─ alembic/       # 双库兼容迁移
│  └─ tests/         # pytest
├─ frontend/web/     # 前台官网（Vite + React + TS + Tailwind）
├─ frontend/admin/   # 后台管理（Vite + React + TS + Ant Design 5）
├─ docs/             # API_CONTRACT.md（接口契约冻结版）
├─ docker-compose.yml
└─ .github/workflows/ # CI
```

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

## 下一步
M2：后端基础（14 模型 + Alembic 双库迁移 + 种子 + JWT + 38 接口实现）。
