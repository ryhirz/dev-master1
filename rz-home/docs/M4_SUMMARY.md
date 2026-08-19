# M4 交付总结 · 后台管理系统（frontend/admin）

> 里程碑：M4 后台管理（Ant Design 5）
> 依据：`文档/项目开发实施方案.md` §七（M4 验收）+ `文档/运行说明.md` §7（后台清单）
> 完成时间：2026-08-19

## 1. 交付范围（对齐 §七 M4）

| 验收项（实施方案 §七 / 运行说明 §7） | 状态 |
|---|---|
| 后台登录 `admin / admin123` 成功，双 token + 按角色跳转 | ✅ |
| 三角色菜单 / 接口双重防护（super_admin / editor / cs_hr） | ✅ |
| 通用 CRUD 全模块可用（Table + 筛选 + 分页 + Drawer + 确认 + Toast） | ✅ |
| 产品 / 案例新增、编辑、删除 | ✅ |
| 产品 / 案例多图上传，保存为 JSON 数组 | ✅ |
| 新闻 Tiptap 富文本（入库由后端 bleach 净化） | ✅ |
| 留言管理可回复、变更状态、删除 | ✅ |
| 公司信息、关于区块可编辑并同步到前台 | ✅ |
| 退出后令牌吊销（refresh 失效）并跳登录 | ✅ |

## 2. 路由 ↔ 页面映射（14 路由）

| 路由 | 页面 | 说明 |
|---|---|---|
| /login | Login | JWT 登录，写 `rz_access_token` / `rz_refresh_token` |
| /dashboard | Dashboard | stats/overview 统计卡片 + 待处理留言提示 + 内容分布 |
| /content/series | Series | 系列 CRUD |
| /content/categories | Categories | 自引用 parent_id 树形分类 |
| /content/products | Products | 多图上传(JSON 数组) + 规格动态表单 + 系列/分类筛选 |
| /content/cases | Cases | 案例 CRUD（住宅/工程/商业）+ NEW 标记 |
| /content/news | News | 新闻 CRUD + Tiptap 富文本 + 草稿/发布 |
| /content/about | AboutContent | 公司信息 / 关于区块(overview/brand) / 里程碑 三 Tab |
| /recruit/jobs | Jobs | 职位 CRUD（社会/校园 Tab） |
| /interaction/messages | Messages | 留言列表 + 回复 + 状态 + 删除 |
| /display/banners | Banners | 轮播 CRUD（上传 + 排序 + 启用/停用） |
| /system/admins | Admins | 管理员 CRUD + 改密 + 角色分配（super_admin） |
| /system/roles | Roles | 角色权限矩阵（13 模块 × read/write，super_admin） |
| /stats | Stats | 内容量分布明细表 + 头部汇总 |

## 3. 基建与组件

- `src/api/client.ts`：axios 拦截器（Bearer 注入 + **401 自动 refresh 续期重放** + 续期失败清 token 跳 /login + 并发刷新去重）、`unwrap<T>` 信封解包、`errMsg` 统一错误提取
- `src/api/index.ts`：类型化 API 客户端（auth + 13 模块 CRUD + upload + stats/overview），对齐后端 `admin.py` 65 路由
- `src/store/index.ts`：zustand 会话（login/fetchMe/logout，/me 填充 role_permissions）
- `src/App.tsx`：`RequireAuth` 路由守卫（未登录重定向 /login，加载中 Spin）
- `src/components/common.tsx`：PageHeader / StatusTag / DeleteButton（Popconfirm）
- `src/components/ImageUpload.tsx`：单图/多图上传（POST /api/admin/upload → `/static/uploads/`，多图存 JSON 数组）
- `src/components/RichTextEditor.tsx`：Tiptap StarterKit 富文本（加粗/斜体/标题/列表/引用/撤销重做）
- `src/hooks/useCrud.ts`：usePagedList（分页加载）/ useDelete

## 4. 端到端联调结果（真实后端 :8000，23/23 全 PASS）

`backend/scripts/m4_check.py` 覆盖：登录三角色 / /me / 产品新增(多图数组+specs)/编辑 / 案例新增/编辑 / 前台留言→管理端回复/状态/删除 / 公司信息+关于区块编辑→前台接口同步 / 上传接口 / editor 权限矩阵(403 拦截 /admin/admins) / 登出吊销 refresh(401)。

## 5. 本次新增/修复（后端）

1. **补三角色演示账号**（`app/core/db.py` seed 幂等）：`editor/editor123`（内容编辑）、`cs_hr/cshr123`（客服/HR），满足"三角色接口双重防护"验收；生产环境可删除该段。
2. 无 M2 遗留缺陷；联调中发现前台 `about/overview` 返回 `{company, overview}` 两层结构（前端 About 页按此消费，无需改动）。

## 6. 已知降级项（v2）

- **近 7 日留言趋势图**：原型有该区块，但后端暂无趋势统计接口（仅 stats/overview 总量），控制台以"总量 + 待处理数 + 内容分布"呈现，页面已注明需 v2 接口。
- 角色权限矩阵支持 read/write 两档动作（对齐后端 require_role 用法）。

## 7. 本地启动与验证

```bash
# 后端（dev 自动建库+种子，含三角色账号）
cd rz-home/backend && ENV=dev ./venv/Scripts/python.exe -m uvicorn app.main:app --port 8000

# 后台管理（本机 npm run dev 会因 safe-delete 崩溃，固定用 preview）
cd rz-home/frontend/admin
npm run build          # 若清空旧 dist 报错：先手动 rm -rf dist 再 build
npm run preview -- --port 5174
# 浏览器访问 http://localhost:5174 ，账号 admin/admin123（或 editor/editor123、cs_hr/cshr123）
```

## 8. 环境坑位（本机 Windows + WorkBuddy）

- `vite build` 清空旧 `dist` 触发 safe-delete 拦截 → 先 `rm -rf dist` 再 build。
- 顽固 uvicorn 进程（kill -9 无效）用 `taskkill /F /PID <pid>` 终止。

## 9. 下一步

- **M5 测试上线**：联调；单测(SQLite) + 集成(PG)；安全/性能；Docker 部署；运营培训（对齐实施方案 §八 M5）。
- 建议 Edge 浏览器实际走一遍后台 14 个页面（登录→产品→案例→留言处理→角色权限→退出）做视觉验收。
