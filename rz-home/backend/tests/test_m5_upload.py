"""M5 上传接口测试：类型校验 / 大小限制 / 成功返回可访问 URL。"""

PNG_HEADER = b"\x89PNG\r\n\x1a\n" + b"0" * 64


def test_upload_png_success(client, admin_auth):
    r = client.post(
        "/api/admin/upload",
        headers=admin_auth,
        files={"file": ("demo.png", PNG_HEADER, "image/png")},
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["url"].startswith("/static/uploads/")
    assert data["filename"].endswith(".png")


def test_upload_rejects_bad_type(client, admin_auth):
    r = client.post(
        "/api/admin/upload",
        headers=admin_auth,
        files={"file": ("evil.exe", b"MZ" * 10, "application/octet-stream")},
    )
    assert r.status_code == 400


def test_upload_rejects_oversize(client, admin_auth):
    # MAX_UPLOAD_MB=10 → 构造 11MB
    big = b"0" * (11 * 1024 * 1024)
    r = client.post(
        "/api/admin/upload",
        headers=admin_auth,
        files={"file": ("big.png", big, "image/png")},
    )
    assert r.status_code == 413


def test_upload_requires_auth(client):
    r = client.post(
        "/api/admin/upload",
        files={"file": ("demo.png", PNG_HEADER, "image/png")},
    )
    assert r.status_code == 401
