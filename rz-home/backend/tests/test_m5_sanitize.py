"""M5 富文本净化测试：入库前必须经 bleach 白名单净化，防存储型 XSS。

覆盖：
1. sanitize_html 单元行为（剥离 script/事件处理器/javascript: 协议）。
2. 通过 API 创建商品/案例/新闻时，恶意 description/content 被净化后落库。

运行：pytest tests/test_m5_sanitize.py -q
"""
import os

os.environ["ENV"] = "dev"
os.environ["DATABASE_URL"] = "sqlite:///./test_rz_home.db"
os.environ["SECRET_KEY"] = "test-secret-key"

import pytest
from fastapi.testclient import TestClient

from app.core.sanitize import sanitize_html
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


# ---------- 1. sanitize_html 单元行为 ----------

def test_sanitize_strips_script():
    out = sanitize_html("<p>hi</p><script>alert(1)</script>")
    assert "<script" not in out
    assert "hi" in out


def test_sanitize_strips_event_handlers():
    out = sanitize_html('<img src="x" onerror="alert(1)"><p onclick="x()">hi</p>')
    assert "onerror" not in out
    assert "onclick" not in out
    assert "hi" in out


def test_sanitize_strips_javascript_protocol():
    out = sanitize_html('<a href="javascript:alert(1)">x</a>')
    assert "javascript:" not in out


def test_sanitize_keeps_safe_tags_and_attrs():
    html = '<p><strong>粗</strong></p><a href="https://e.com" target="_blank" rel="noopener">链接</a><img src="https://e.com/a.png" alt="图">'
    out = sanitize_html(html)
    assert "<strong>" in out
    assert 'href="https://e.com"' in out
    assert 'target="_blank"' in out
    assert 'src="https://e.com/a.png"' in out


def test_sanitize_none_passthrough():
    assert sanitize_html(None) is None


# ---------- 2. 通过 API 落地净化 ----------

def test_product_description_sanitized_via_api(client, auth):
    r = client.post("/api/admin/series", headers=auth, json={"name": "测试系列", "slug": "test-series"})
    assert r.status_code == 200, r.text
    sid = r.json()["data"]["id"]
    r = client.post("/api/admin/categories", headers=auth, json={"name": "测试分类", "slug": "test-cat"})
    assert r.status_code == 200, r.text
    cid = r.json()["data"]["id"]

    malicious = '<p>正常描述</p><script>alert(1)</script><img src=x onerror=alert(2)>'
    r = client.post("/api/admin/products", headers=auth, json={
        "name": "净化测试商品", "series_id": sid, "category_id": cid,
        "price": 100, "description": malicious, "images": ["/img/a.jpg"],
    })
    assert r.status_code == 200, r.text
    pid = r.json()["data"]["id"]

    r = client.get(f"/api/products/{pid}")
    assert r.status_code == 200
    desc = r.json()["data"]["product"]["description"]
    assert "<script" not in desc
    assert "onerror" not in desc
    assert "正常描述" in desc


def test_case_content_sanitized_via_api(client, auth):
    malicious = '<div onclick="evil()">案例内容</div><script>steal()</script>'
    r = client.post("/api/admin/cases", headers=auth, json={
        "title": "净化测试案例", "slug": "sanitize-case", "content": malicious,
    })
    assert r.status_code == 200, r.text
    cid = r.json()["data"]["id"]

    r = client.get("/api/cases")
    assert r.status_code == 200
    item = next((c for c in r.json()["data"]["items"] if c["id"] == cid), None)
    assert item is not None
    assert "<script" not in item["content"]
    assert "onclick" not in item["content"]
    assert "案例内容" in item["content"]
