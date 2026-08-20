"""M5 公开接口契约测试：首页聚合 / 列表分页 / 关于 / 轮播 / 留言提交。"""
import pytest


def test_home_overview_structure(client):
    r = client.get("/api/home/overview")
    assert r.status_code == 200
    body = r.json()
    assert body["code"] == 0
    data = body["data"]
    assert {"banners", "recommended_products", "company", "latest_cases", "latest_news", "job_open_count"} <= set(data)
    assert data["company"] and data["company"]["name"] == "Rz智能家居"
    # 种子应提供可展示内容（无 key 演示）
    assert len(data["recommended_products"]) > 0
    assert len(data["latest_cases"]) > 0


def test_products_list_paged_public(client):
    r = client.get("/api/products?page=1&page_size=3")
    assert r.status_code == 200
    data = r.json()["data"]
    assert {"items", "page", "page_size", "total"} <= set(data)
    assert data["total"] > 0
    item = data["items"][0]
    assert isinstance(item["images"], list)


def test_product_detail(client):
    r = client.get("/api/products?page=1&page_size=1")
    pid = r.json()["data"]["items"][0]["id"]
    r2 = client.get(f"/api/products/{pid}")
    assert r2.status_code == 200
    assert {"product", "related"} <= set(r2.json()["data"])


@pytest.mark.parametrize("ep", ["/api/cases", "/api/news", "/api/jobs"])
def test_list_endpoints_paged(client, ep):
    r = client.get(ep)
    assert r.status_code == 200
    data = r.json()["data"]
    assert {"items", "page", "page_size", "total"} <= set(data)
    assert data["total"] > 0


def test_about_endpoints(client):
    r = client.get("/api/about/overview")
    assert r.status_code == 200
    assert {"company", "overview"} <= set(r.json()["data"])
    r2 = client.get("/api/about/history")
    assert isinstance(r2.json()["data"], list) and len(r2.json()["data"]) > 0
    r3 = client.get("/api/about/brand")
    assert r3.status_code == 200 and r3.json()["data"]["code"] == "brand"


def test_banners_and_contact(client):
    r = client.get("/api/banners")
    assert isinstance(r.json()["data"], list) and len(r.json()["data"]) > 0
    r2 = client.get("/api/contact/info")
    assert {"name", "address", "phone", "email", "icp_no"} <= set(r2.json()["data"])


def test_inquiry_contact_submit(client):
    # 限频为模块级全局计数（60s 窗口），先清空避免受其他测试影响
    from app.routers import public as public_router

    public_router._rate.clear()
    r = client.post(
        "/api/inquiries",
        json={"type": "contact", "name": "公开用户", "phone": "13700000000", "content": "你好"},
    )
    assert r.status_code == 200
    assert r.json()["data"]["id"]
