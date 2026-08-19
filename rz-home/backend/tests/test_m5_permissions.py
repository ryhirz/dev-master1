"""M5 权限矩阵测试：三角色对模块接口的 读/写 双重防护（对齐《开发技术文档》§4.7.D）。"""

# editor 拥有内容模块权限，无系统模块权限
def test_editor_read_content(client, editor_auth):
    r = client.get("/api/admin/products", headers=editor_auth)
    assert r.status_code == 200
    assert r.json()["code"] == 0


def test_editor_write_content(client, editor_auth):
    r = client.post(
        "/api/admin/products",
        headers=editor_auth,
        json={"name": "权限测试产品", "status": "active"},
    )
    assert r.status_code == 200


def test_editor_forbidden_system(client, editor_auth):
    # editor 无 admin_user/role 权限 → 403
    r = client.get("/api/admin/admins", headers=editor_auth)
    assert r.status_code == 403
    r2 = client.get("/api/admin/roles", headers=editor_auth)
    assert r2.status_code == 403


def test_editor_forbidden_write_role(client, editor_auth):
    r = client.post("/api/admin/roles", headers=editor_auth, json={"name": "x", "permissions": {}})
    assert r.status_code == 403


# cs_hr 拥有 job/message 权限，无内容模块权限
def test_cshr_read_jobs(client, cshr_auth):
    r = client.get("/api/admin/jobs", headers=cshr_auth)
    assert r.status_code == 200


def test_cshr_read_messages(client, cshr_auth):
    r = client.get("/api/admin/messages", headers=cshr_auth)
    assert r.status_code == 200


def test_cshr_forbidden_products(client, cshr_auth):
    r = client.get("/api/admin/products", headers=cshr_auth)
    assert r.status_code == 403


def test_cshr_forbidden_write_job(client, cshr_auth):
    # cs_hr 有 job write 权限，应可写
    r = client.post("/api/admin/jobs", headers=cshr_auth, json={"title": "客服专员", "status": "active"})
    assert r.status_code == 200


def test_no_token_401(client):
    r = client.get("/api/admin/cases")
    assert r.status_code == 401
