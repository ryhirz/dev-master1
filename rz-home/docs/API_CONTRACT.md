# Rz家居 后端 API 契约（冻结版）

> 版本：v0.1（M1 冻结，实现见 M2–M4）
> 依据：《开发技术文档_Rz家居网站.md》§5（接口契约）、《数据库设计文档_Rz家居网站.md》§4
> 配套：后端 `app/routers/public.py`、`app/routers/admin.py` 已按本契约挂载全部接口桩（返回 501，envelope code 5000）。

---

## 一、通用约定

### 1.1 基础路径
- 公开接口：`/api/*`
- 管理接口：`/api/admin/*`（除 login/refresh 外均需 `Authorization: Bearer <access_token>`）

### 1.2 统一响应信封
```json
{ "code": 0, "message": "ok", "data": {}, "request_id": "hex" }
```
- 成功：`HTTP 200`，`code=0`。
- 业务失败：`HTTP` 状态与 `code` 对应（见 §1.4），`data` 携带明细。

### 1.3 分页结构
```json
{ "items": [], "page": 1, "page_size": 10, "total": 0 }
```

### 1.4 错误码
| code | HTTP | 含义 |
| --- | --- | --- |
| 1001 | 400 | 参数缺失 |
| 1002 | 400 | 参数格式错误 |
| 1003 | 422 | 校验失败（Pydantic） |
| 2001 | 401 | 未认证 / 令牌缺失 |
| 2002 | 401 | 令牌失效或过期 |
| 2003 | 403 | 无权限（角色/模块越权） |
| 2004 | 404/409 | 资源不存在 / 冲突 |
| 3001 | 404 | 前台资源不可见（hidden/draft） |
| 3002 | 429 | 频率限制（留言 10/min） |
| 429  | 429 | 限频（与 3002 同义，按场景取用） |
| 5000 | 500 | 服务器内部错误 |

### 1.5 鉴权流程
1. `POST /api/admin/login` → 返回 `access_token`(30min) + `refresh_token`(7d)。
2. 请求携带 `Authorization: Bearer <access_token>`。
3. 401 → 前端用 `refresh_token` 调 `POST /api/admin/refresh` 换新并重试。
4. refresh 失效 → 跳登录；`POST /api/admin/logout` 将 refresh 加入吊销名单。

---

## 二、公开接口（16 项）

| # | 方法 | 路径 | 说明 | 响应 data |
| --- | --- | --- | --- | --- |
| P1 | GET | /api/health | 健康检查（信封） | {status} |
| P2 | GET | /api/home/overview | 首页聚合：轮播+推荐产品+企业实力+最新案例/新闻+招聘CTA | HomeOverview |
| P3 | GET | /api/series | 产品系列列表 | Page<Series> |
| P4 | GET | /api/products | 产品列表（series/category/keyword 筛选+分页） | Page<Product> |
| P5 | GET | /api/products/{id} | 产品详情（图集/规格/相关推荐）；hidden→3001 | ProductDetail |
| P6 | GET | /api/cases | 案例列表（分类/is_new 优先/分页） | Page<Case> |
| P7 | GET | /api/cases/{id} | 案例详情 | CaseDetail |
| P8 | GET | /api/news | 新闻列表（Tab company/industry/置顶/仅published） | Page<News> |
| P9 | GET | /api/news/{id} | 新闻详情（draft→3001） | NewsDetail |
| P10 | GET | /api/about/overview | 关于总览（company_info + 入口） | AboutOverview |
| P11 | GET | /api/about/history | 发展历程（milestone） | list<Milestone> |
| P12 | GET | /api/about/brand | 品牌介绍（about_section code=brand） | AboutSection |
| P13 | GET | /api/contact/info | 联系信息（company_info 联系字段） | CompanyContact |
| P14 | GET | /api/jobs | 招聘列表（Tab social/campus） | Page<Job> |
| P15 | GET | /api/jobs/{id} | 招聘详情 | JobDetail |
| P16 | GET | /api/banners | 前台轮播（仅启用） | list<Banner> |
| P17 | POST | /api/inquiries | 留言/求职意向（type=contact / job_application, job_id） | {id} |

> 说明：实施方案将 P1(health) 计为系统项，业务公开接口为 16 项，与《开发技术文档》一致。

---

## 三、管理接口（JWT 必需）

> ⚠️ **数量说明**：实施方案摘要写"管理接口 22 项"，该数字为"模块计数"而非路由计数。
> 本契约按真实 CRUD 落地，实际路由数为 **65**（15 模块 × 标准 CRUD + 鉴权 4 + 公司信息/板块/上传/统计）。
> 以本表（可运行路由）为冻结依据；若需压缩到 22，请明确合并策略后修订。

### 3.1 鉴权（4）
| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | /api/admin/login | 公开 | 登录，返回双 token |
| POST | /api/admin/refresh | 公开 | 刷新 access |
| POST | /api/admin/logout | 必需 | 吊销 refresh |
| GET | /api/admin/me | 必需 | 当前管理员+角色 |

### 3.2 内容模块（标准 CRUD：list/create/get/update/delete）
模块键（对应 `require_role(module, action)`，见《开发技术文档》§4.7.D）：

| 模块 | 路径前缀 | 角色（M2  enforced） |
| --- | --- | --- |
| product_series | /api/admin/series | editor |
| category | /api/admin/categories | editor |
| product | /api/admin/products | editor |
| cases | /api/admin/cases | editor |
| news | /api/admin/news | editor |
| job | /api/admin/jobs | cs_hr |
| message | /api/admin/messages | cs_hr（list/get/update/delete） |
| banner | /api/admin/banners | editor |
| about_section | /api/admin/about-sections | editor（list/get/put by code） |
| company_info | /api/admin/company-info | editor（get/put，单行 id=1） |
| milestone | /api/admin/milestones | editor |
| admin_user | /api/admin/admins | super_admin |
| role | /api/admin/roles | super_admin |

> 每个模块 CRUD 路由示例（以 products 为例）：
> `GET /api/admin/products`、`POST /api/admin/products`、`GET /api/admin/products/{id}`、`PUT /api/admin/products/{id}`、`DELETE /api/admin/products/{id}`。

### 3.3 其他
| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | /api/admin/upload | 必需 | 图片/文件上传，返回可访问 URL |
| GET | /api/admin/stats/overview | 必需 | 控制台数据统计概览（P1） |

---

## 四、数据模型对应（详见《数据库设计文档》）
14 张表：`product_series`、`category`、`product`、`cases`、`news`、`job`、`message`、`banner`、`company_info`、`about_section`、`milestone`、`role`、`admin_user`、`audit_log`。
枚举值在 Pydantic 校验（DB 不建 CHECK）；`updated_at` 由 ORM `onupdate` 维护；软删除用 `status` 标记。

---

## 五、实现顺序（M2）
config/db → models(14) → schemas → security/deps → 公开接口 → 管理接口 → upload → stats → 限频 → Alembic 迁移 + 种子。
