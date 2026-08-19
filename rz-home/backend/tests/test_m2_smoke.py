"""M2 冒烟测试：鉴权 + 各模块 CRUD + 公开可见性 + 限频。

使用 FastAPI TestClient（触发 lifespan 自动建表 + 种子）。
运行：pytest tests/test_m2_smoke.py -q
"""
import os

os.environ["ENV"] = "dev"
os.environ["DATABASE_URL"] = "sqlite:///./test_rz_home.db"
os.environ["SECRET_KEY"] = "test-secret-key"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.db import engine
from app.models.base import Base


def _reset_tables():
    from app import models  # 触发元数据注册

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


@pytest.fixture(scope="module")
def client():
    _reset_tables()
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def auth(client):
    r = client.post("/api/admin/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, r.text
    token = r.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "ok"


def test_login_and_me(client, auth):
    r = client.get("/api/admin/me", headers=auth)
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["username"] == "admin"
    assert data["role_name"] == "super_admin"


def test_role_list(client, auth):
    r = client.get("/api/admin/roles", headers=auth)
    assert r.status_code == 200
    names = {x["name"] for x in r.json()["data"]}
    assert {"super_admin", "editor", "cs_hr"} <= names


def test_series_product_crud(client, auth):
    r = client.post("/api/admin/series", headers=auth, json={"name": "胡桃禮", "slug": "walnut-ritual"})
    assert r.status_code == 200, r.text
    sid = r.json()["data"]["id"]

    r = client.post("/api/admin/categories", headers=auth, json={"name": "客厅", "slug": "living-room"})
    assert r.status_code == 200, r.text
    cid = r.json()["data"]["id"]

    r = client.post("/api/admin/products", headers=auth, json={
        "name": "明式圈椅", "series_id": sid, "category_id": cid,
        "price": 12800, "is_recommended": True, "images": ["/img/a.jpg"],
    })
    assert r.status_code == 200, r.text
    pid = r.json()["data"]["id"]

    r = client.get(f"/api/admin/products/{pid}", headers=auth)
    assert r.status_code == 200
    assert r.json()["data"]["series_name"] == "胡桃禮"

    r = client.get("/api/products")
    assert r.status_code == 200
    assert r.json()["data"]["total"] >= 1

    r = client.delete(f"/api/admin/products/{pid}", headers=auth)
    assert r.status_code == 200
    r = client.get(f"/api/products/{pid}")
    assert r.status_code == 404


def test_news_visibility(client, auth):
    r = client.post("/api/admin/news", headers=auth, json={
        "title": "企业新闻草稿", "category": "company", "status": "draft",
    })
    assert r.status_code == 200
    nid = r.json()["data"]["id"]

    r = client.get("/api/news")
    assert r.status_code == 200
    ids = {x["id"] for x in r.json()["data"]["items"]}
    assert nid not in ids

    r = client.get(f"/api/news/{nid}")
    assert r.status_code == 404


def test_inquiry_rate_limit(client):
    last = None
    for i in range(12):
        last = client.post("/api/inquiries", json={
            "type": "contact", "name": f"用户{i}", "phone": "13800000000", "content": "咨询",
        })
    assert last.status_code == 429, last.text


def test_stats_overview(client, auth):
    r = client.get("/api/admin/stats/overview", headers=auth)
    assert r.status_code == 200
    data = r.json()["data"]
    assert "products" in data and "messages" in data
