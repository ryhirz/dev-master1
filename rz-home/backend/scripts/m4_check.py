# -*- coding: utf-8 -*-
"""M4 后台管理端到端联调脚本：对齐《运行说明.md》§7 后台清单 + 《实施方案》§七 M4 验收"""
import io
import json
import urllib.request

BASE = "http://localhost:8000/api"
checks = []

def chk(name, cond, extra=""):
    checks.append((name, bool(cond)))
    print(("PASS" if cond else "FAIL"), name, extra)

def req(method, path, token=None, body=None, raw=False):
    url = BASE + path
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=10) as resp:
            ct = resp.headers.get("Content-Type", "")
            if "json" in ct:
                return resp.status, json.load(resp)
            return resp.status, resp.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.load(e)
        except Exception:
            return e.code, {"detail": str(e)}

# ---------- 1. 登录（默认超管 admin/admin123） ----------
s, d = req("POST", "/admin/login", body={"username": "admin", "password": "admin123"})
chk("登录 admin/admin123 -> 200", s == 200 and d.get("code") == 0)
token = d["data"]["access_token"] if d.get("data") else None
refresh = d["data"]["refresh_token"] if d.get("data") else None
chk("登录返回 admin 信息(role_name)", bool(d.get("data", {}).get("admin")) and d["data"]["admin"].get("role_name") == "super_admin")
chk("登录返回双 token", bool(token) and bool(refresh))

# ---------- 2. /me ----------
s, d = req("GET", "/admin/me", token=token)
chk("/me -> 200 且含 role_permissions", s == 200 and d.get("data", {}).get("role_permissions") is not None)

# ---------- 3. 产品 CRUD（含多图 JSON 数组 + specs） ----------
s, d = req("POST", "/admin/products", token=token, body={
    "name": "联调测试-云朵沙发", "model_no": "M4-TEST-01",
    "series_id": 1, "category_id": 1,
    "images": ["/static/uploads/test-a.jpg", "/static/uploads/test-b.jpg"],
    "specs": {"材质": "北美胡桃木", "尺寸": "2.2m"},
    "price": 8999.0, "is_recommended": True, "status": "active",
})
pid = d.get("data", {}).get("id")
chk("产品新增 -> images 为 JSON 数组", s == 200 and isinstance(d.get("data", {}).get("images"), list) and len(d["data"]["images"]) == 2)
chk("产品新增 -> specs 保存", d.get("data", {}).get("specs", {}).get("材质") == "北美胡桃木")

s, d = req("PUT", f"/admin/products/{pid}", token=token, body={"price": 9999.0, "is_recommended": False})
chk("产品编辑生效", s == 200 and d.get("data", {}).get("price") == 9999.0 and d["data"]["is_recommended"] is False)

# ---------- 4. 案例 CRUD ----------
s, d = req("POST", "/admin/cases", token=token, body={
    "title": "联调测试-云朵客厅案例", "category": "住宅",
    "images": ["/static/uploads/case-1.jpg"], "is_new": True, "status": "active",
})
cid = d.get("data", {}).get("id")
chk("案例新增(多图)", s == 200 and isinstance(d.get("data", {}).get("images"), list))
s, d = req("PUT", f"/admin/cases/{cid}", token=token, body={"is_new": False, "status": "disabled"})
chk("案例编辑(状态/标记)", s == 200 and d.get("data", {}).get("status") == "disabled" and d["data"]["is_new"] is False)

# ---------- 5. 留言：公开提交 -> 管理端回复/状态/删除 ----------
s, d = req("POST", "/inquiries", body={"type": "contact", "name": "联调用户", "phone": "13800001111", "content": "想了解沙发报价"})
mid = d.get("data", {}).get("id")
chk("前台留言提交成功", s == 200 and mid is not None)
# 列表验证
s, d = req("GET", "/admin/messages?page=1&page_size=10", token=token)
msgs = d.get("data", {}).get("items", [])
chk("留言列表含新留言(status=new)", any(m.get("id") == mid and m.get("status") == "new" for m in msgs))
s, d = req("PUT", f"/admin/messages/{mid}", token=token, body={"status": "handled", "reply": "感谢咨询，稍后联系您"})
chk("留言回复+状态变更", s == 200 and d.get("data", {}).get("status") == "handled" and d["data"].get("reply") == "感谢咨询，稍后联系您")

# ---------- 6. 公司信息 / 关于区块编辑 -> 前台同步 ----------
s, d = req("PUT", "/admin/company-info", token=token, body={"phone": "400-800-8888", "honor_count": 30})
chk("公司信息编辑", s == 200 and d.get("data", {}).get("phone") == "400-800-8888")
s, d = req("GET", "/contact/info")
chk("前台 contact/info 同步新电话", s == 200 and d.get("data", {}).get("phone") == "400-800-8888")
s, d = req("GET", "/home/overview")
chk("前台 home/overview 荣誉数同步", d.get("data", {}).get("company", {}).get("honor_count") == 30)

s, d = req("PUT", "/admin/about-sections/overview", token=token, body={"title": "关于Rz家居", "content": "<p>联调更新：匠心定制。</p>"})
chk("关于区块编辑", s == 200 and "联调更新" in (d.get("data", {}).get("content") or ""))
s, d = req("GET", "/about/overview")
ov = d.get("data", {}).get("overview", {}) or {}
chk("前台 about/overview 同步", s == 200 and "联调更新" in (ov.get("content") or ""))

# ---------- 7. 上传接口（伪造一张小图） ----------
import uuid
fake = b"\x89PNG\r\n\x1a\n" + b"0" * 200
boundary = uuid.uuid4().hex
body = (
    f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"t.png\"\r\n"
    "Content-Type: image/png\r\n\r\n"
).encode() + fake + f"\r\n--{boundary}--\r\n".encode()
url = BASE + "/admin/upload"
r = urllib.request.Request(url, data=body, headers={
    "Content-Type": f"multipart/form-data; boundary={boundary}",
    "Authorization": f"Bearer {token}",
}, method="POST")
try:
    with urllib.request.urlopen(r, timeout=10) as resp:
        ud = json.load(resp)
    chk("上传接口 -> /static/uploads/ 地址", ud.get("code") == 0 and ud["data"]["url"].startswith("/static/uploads/"))
except Exception as e:
    chk("上传接口 -> /static/uploads/ 地址", False, str(e))

# ---------- 8. 角色权限：editor 访问 admin-only ----------
s, d = req("POST", "/admin/login", body={"username": "editor", "password": "editor123"})
if s == 200 and d.get("code") == 0:
    etoken = d["data"]["access_token"]
    chk("editor 账号可登录", True)
    s, d = req("GET", "/admin/admins", token=etoken)
    chk("editor 访问 /admin/admins -> 403(权限矩阵)", s == 403)
    s, d = req("GET", "/admin/products", token=etoken)
    chk("editor 访问 /admin/products -> 200", s == 200)
else:
    chk("editor 账号可登录", False, f"HTTP {s} {d}")
    etoken = None

# ---------- 9. 退出吊销 ----------
s, d = req("POST", "/admin/logout", token=token, body={"refresh_token": refresh})
chk("登出接口", s == 200 and d.get("code") == 0)
s, d = req("POST", "/admin/refresh", body={"refresh_token": refresh})
chk("登出后 refresh 已吊销 -> 401", s == 401)

# ---------- 清理测试数据（产品/案例/留言） ----------
req("DELETE", f"/admin/products/{pid}", token=token)
req("DELETE", f"/admin/cases/{cid}", token=token)
req("DELETE", f"/admin/messages/{mid}", token=token)
# 恢复公司信息电话（避免污染演示数据）
req("PUT", "/admin/company-info", token=token, body={"phone": "400-888-9999", "honor_count": 28})
print()
ok = all(c for _, c in checks)
print("=" * 40)
print("ALL PASS" if ok else "SOME FAILED", f"({sum(1 for _, c in checks if c)}/{len(checks)})")
