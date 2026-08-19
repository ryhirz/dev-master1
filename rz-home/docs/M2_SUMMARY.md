# M2 阶段总结 · 数据模型与 CRUD 落地

> 日期：2026-08-19
> 状态：✅ 完成（编译通过 / 7 项冒烟测试通过 / Alembic 迁移可应用 / uvicorn 真实启动验证通过）
> 依据：《数据库设计文档_Rz家居网站.md》(v1.1)、《API_CONTRACT.md》(冻结版)

## 一、关键决策（对齐数据库设计文档）

1. **单库 14 表**：严格以《数据库设计文档》为准。文档 §1.3「双库策略」指 **Dev SQLite ↔ Prod PostgreSQL 的环境切换**（由 `DATABASE_URL` 控制），全文 **14 张表无任何"统计库 rz_stats"定义**。因此 M2 采用单库 14 表，统计概览走主库聚合查询（`COUNT`）。（这是对实施方案 M1 措辞的修正，完全遵循"数据库设计文档为主"。）
2. **枚举在 Pydantic 校验，DB 不建 CHECK**：与文档 §2.3 / §4.3 一致，保证 SQLite / PostgreSQL 行为一致。
3. **软删除用 `status` 标记**：所有 `delete` 接口走软删（status→hidden / 管理员→disabled / 留言→ignored）；唯 `role` 无 status 字段，做物理删除（FK RESTRICT 保护，且校验无管理员引用）。
4. **`updated_at` 由 ORM `onupdate` 维护**；`created_at` 默认 `func.now()`（UTC）。

## 二、交付内容

### 后端（backend/）
| 模块 | 文件 | 说明 |
|---|---|---|
| 引擎 | `app/core/db.py` | SQLite PRAGMA foreign_keys；`init_db()` 建表 + `seed()` 幂等种子 |
| 模型 | `app/models/{catalog,content,crm,system}.py` | 14 张表 ORM（SQLAlchemy 2.0 Mapped），含 `role` 关系、`*_id` 外键索引、JSON 字段 |
| Schema | `app/schemas/{catalog,content,crm,system}.py` | Create/Update/Response/列表筛选；时间戳统一 `datetime` |
| 鉴权 | `app/core/security.py` | JWT（access 30min / refresh 7d，含 jti 内存黑名单吊销）；bcrypt |
| 依赖 | `app/deps/common.py` | `get_current_admin`（查表 + active 校验）、`require_role(module,action)`（按 `role.permissions` 校验，支持 `*` 全模块） |
| 公开接口 | `app/routers/public.py` | **16 项**：health / 首页聚合 / 系列 / 产品 / 案例 / 新闻 / 关于 / 联系 / 招聘 / 轮播 / 留言提交（限频 10/min） |
| 管理接口 | `app/routers/admin.py` | 登录/刷新/登出/me + 13 模块标准 CRUD + 上传 + 统计概览（65 路由） |
| 审计 | `app/services/audit.py` | 关键写操作与登录落库 `audit_log` |
| 迁移 | `alembic/versions/..._init_14_tables.py` | 初始迁移（14 表 + 索引），`alembic upgrade head` 已验证 |
| 种子 | `scripts/seed.py` | 角色三行 / 公司信息(id=1) / 默认超管 `admin/admin123` |
| 测试 | `tests/test_m2_smoke.py` | 7 项 pytest：鉴权、CRUD、公开可见性、限频、统计 |

### 验证结果
- `python -m compileall app` ✅
- `pytest tests/test_m2_smoke.py` → **7 passed** ✅
- `alembic upgrade head` → 14 表 + alembic_version ✅
- `uvicorn app.main:app` 真实启动 → /api/health、登录拿 token、鉴权产品列表均 200；`/openapi.json` 注册 **49** 路由 ✅

## 三、环境/踩坑记录（供后续会话复用）
- **bcrypt 版本**：`passlib` + `bcrypt>=4.1` 不兼容（bcrypt 强制 72 字节限制破坏 passlib 后端探测）。已固定 `bcrypt==4.0.1`，务必不要升级到 5.x。
- **响应信封**：`ok()` 内统一 `jsonable_encoder(data)`，否则 Pydantic `model_dump()` 的 `datetime` 对象无法被 `JSONResponse` 序列化。
- **测试清理**：本环境有 `safe-delete` 拦截 `os.remove`，测试改用 `Base.metadata.drop_all + create_all` 重置，避免删文件。
- 默认超管 `admin / admin123`，首次部署须改密（bcrypt 哈希经后端命令生成）。

## 四、下一步（M3）
实现前台官网页面（frontend/web）对接本阶段 API（12 路由 + 主框架 + Tailwind 设计令牌），严格对齐 `prototype_frontend.html` 与《UIUX_Rz家居网站.md》。
