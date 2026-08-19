"""M1 冒烟测试：健康检查 + 接口桩返回 501（envelope code 5000）。"""
from fastapi.testclient import TestClient

from app.main import app


def test_health():
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_public_health_envelope():
    client = TestClient(app)
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["code"] == 0 and body["data"]["status"] == "ok"


def test_public_stub_returns_501():
    client = TestClient(app)
    r = client.get("/api/series")
    assert r.status_code == 501
    assert r.json()["code"] == 5000


def test_admin_stub_requires_auth():
    client = TestClient(app)
    r = client.get("/api/admin/series")
    assert r.status_code == 401
