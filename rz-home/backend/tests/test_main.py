"""M1 回归测试（已按 M2 真实实现更新）：健康检查 + 响应信封 + 未授权 401。

注：M1 时代的 501 接口桩断言已删除——接口在 M2 已全部实现（如 /api/series 返回 200 真实数据）。
"""
from fastapi.testclient import TestClient

from app.main import app


def test_health():
    client = TestClient(app)
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "ok"


def test_public_health_envelope():
    client = TestClient(app)
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    # 统一信封 {code, message, data, request_id}
    assert body["code"] == 0
    assert body["data"]["status"] == "ok"
    assert body["message"] == "ok"


def test_public_series_returns_data():
    # M2 已实现公开接口：/api/series 应返回真实分页数据而非 501
    client = TestClient(app)
    r = client.get("/api/series")
    assert r.status_code == 200
    body = r.json()
    assert body["code"] == 0
    assert "items" in body["data"] and "total" in body["data"]


def test_admin_stub_requires_auth():
    # 管理接口未携带 token → 401
    client = TestClient(app)
    r = client.get("/api/admin/series")
    assert r.status_code == 401
