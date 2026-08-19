"""M5 CRUD 冒烟测试：产品（多图 JSON 数组+specs）、案例、留言处理、公司信息/关于同步、分页结构、信封格式。"""
import pytest


def _paged_shape(data):
    return {"items", "page", "page_size", "total"} <= set(data)


def test_product_create_with_images_and_specs(client, admin_auth):
    r = client.post(
        "/api/admin/products",
        headers=admin_auth,
        json={
            "name": "M5测试-原木桌",
            "images": ["/static/uploads/a.jpg", "/static/uploads/b.jpg"],
            "specs": {"材质": "胡桃木", "尺寸": "1.8m"},
            "price": 5999.0,
            "is_recommended": True,
            "status": "active",
        },
    )
    assert r.status_code == 200
    data = r.json()["data"]
    # 多图必须保存为 JSON 数组（M4 验收项）
    assert isinstance(data["images"], list) and len(data["images"]) == 2
    assert data["specs"]["材质"] == "胡桃木"
    return data["id"]


def test_product_update_and_delete(client, admin_auth):
    pid = test_product_create_with_images_and_specs(client, admin_auth)
    r = client.put(
        f"/api/admin/products/{pid}",
        headers=admin_auth,
        json={"price": 6999.0, "is_recommended": False, "status": "disabled"},
    )
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["price"] == 6999.0 and d["is_recommended"] is False and d["status"] == "disabled"
    # 删除为软删（status → hidden）：管理端详情仍可见，公开列表不可见
    r = client.delete(f"/api/admin/products/{pid}", headers=admin_auth)
    assert r.status_code == 200
    r2 = client.get(f"/api/admin/products/{pid}", headers=admin_auth)
    assert r2.status_code == 200 and r2.json()["data"]["status"] == "hidden"
    r3 = client.get("/api/products?page=1&page_size=100")
    ids = [it["id"] for it in r3.json()["data"]["items"]]
    assert pid not in ids


def test_products_list_paged(client, admin_auth):
    r = client.get("/api/admin/products?page=1&page_size=5", headers=admin_auth)
    assert r.status_code == 200
    assert _paged_shape(r.json()["data"])


def test_case_crud(client, admin_auth):
    r = client.post(
        "/api/admin/cases",
        headers=admin_auth,
        json={"title": "M5测试-工程案例", "category": "工程", "images": ["/static/uploads/c1.jpg"], "status": "active"},
    )
    assert r.status_code == 200
    cid = r.json()["data"]["id"]
    r = client.put(f"/api/admin/cases/{cid}", headers=admin_auth, json={"is_new": True, "status": "disabled"})
    assert r.status_code == 200
    assert r.json()["data"]["is_new"] is True
    r = client.delete(f"/api/admin/cases/{cid}", headers=admin_auth)
    assert r.status_code == 200


def test_message_handle_flow(client, admin_auth):
    # 限频为模块级全局计数（60s 窗口），先清空避免受前序测试影响
    from app.routers import public as public_router

    public_router._rate.clear()
    # 公开提交留言
    r = client.post(
        "/api/inquiries",
        json={"type": "contact", "name": "测试用户", "phone": "13900000000", "content": "咨询报价"},
    )
    assert r.status_code == 200
    mid = r.json()["data"]["id"]
    # 管理端回复 + 状态变更
    r = client.put(
        f"/api/admin/messages/{mid}",
        headers=admin_auth,
        json={"status": "handled", "reply": "已回复，谢谢咨询"},
    )
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["status"] == "handled" and d["reply"] == "已回复，谢谢咨询"
    r = client.delete(f"/api/admin/messages/{mid}", headers=admin_auth)
    assert r.status_code == 200


def test_company_info_edit_syncs_public(client, admin_auth):
    r = client.put("/api/admin/company-info", headers=admin_auth, json={"phone": "400-123-4567"})
    assert r.status_code == 200
    r2 = client.get("/api/contact/info")
    assert r2.status_code == 200
    assert r2.json()["data"]["phone"] == "400-123-4567"


def test_about_section_edit_syncs_public(client, admin_auth):
    r = client.put(
        "/api/admin/about-sections/brand",
        headers=admin_auth,
        json={"title": "品牌理念", "content": "<p>M5 同步测试</p>"},
    )
    assert r.status_code == 200
    r2 = client.get("/api/about/brand")
    assert r2.status_code == 200
    assert "M5 同步测试" in r2.json()["data"]["content"]


def test_milestone_crud(client, admin_auth):
    r = client.post(
        "/api/admin/milestones",
        headers=admin_auth,
        json={"year": "2026", "title": "M5里程碑", "sort_order": 1, "status": "active"},
    )
    assert r.status_code == 200
    mid = r.json()["data"]["id"]
    r = client.put(f"/api/admin/milestones/{mid}", headers=admin_auth, json={"title": "M5里程碑-更新"})
    assert r.status_code == 200 and r.json()["data"]["title"] == "M5里程碑-更新"
    r = client.delete(f"/api/admin/milestones/{mid}", headers=admin_auth)
    assert r.status_code == 200


def test_banner_crud(client, admin_auth):
    r = client.post(
        "/api/admin/banners",
        headers=admin_auth,
        json={"title": "M5轮播", "image": "/static/uploads/b1.jpg", "sort_order": 1, "status": "active"},
    )
    assert r.status_code == 200
    bid = r.json()["data"]["id"]
    r = client.delete(f"/api/admin/banners/{bid}", headers=admin_auth)
    assert r.status_code == 200
