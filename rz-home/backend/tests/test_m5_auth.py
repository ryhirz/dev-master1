"""M5 认证全流程测试：登录/错误密码/禁用账号/refresh/登出吊销/me 鉴权。"""
import pytest


def test_login_success(client):
    r = client.post("/api/admin/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200
    body = r.json()
    assert body["code"] == 0
    data = body["data"]
    assert data["access_token"] and data["refresh_token"]
    assert data["admin"]["username"] == "admin"
    assert data["admin"]["role_name"] == "super_admin"


def test_login_wrong_password(client):
    r = client.post("/api/admin/login", json={"username": "admin", "password": "wrong-pass"})
    assert r.status_code == 401
    assert r.json()["code"] == 2001


def test_login_unknown_user(client):
    r = client.post("/api/admin/login", json={"username": "nobody", "password": "x123456"})
    assert r.status_code == 401


def test_login_disabled_account(client, admin_auth):
    # 将 admin 置为禁用 → 登录 401；随后恢复
    from app.core.db import SessionLocal
    from app.models.system import AdminUser

    db = SessionLocal()
    u = db.query(AdminUser).filter(AdminUser.username == "admin").first()
    u.status = "disabled"
    db.commit()
    r = client.post("/api/admin/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 401
    u.status = "active"
    db.commit()
    db.close()


def test_refresh_success(client):
    r = client.post("/api/admin/login", json={"username": "admin", "password": "admin123"})
    refresh = r.json()["data"]["refresh_token"]
    r2 = client.post("/api/admin/refresh", json={"refresh_token": refresh})
    assert r2.status_code == 200
    assert r2.json()["data"]["access_token"]


def test_refresh_invalid(client):
    r = client.post("/api/admin/refresh", json={"refresh_token": "not-a-jwt"})
    assert r.status_code == 401


def test_logout_revokes_refresh(client):
    r = client.post("/api/admin/login", json={"username": "admin", "password": "admin123"})
    data = r.json()["data"]
    r2 = client.post(
        "/api/admin/logout",
        headers={"Authorization": f"Bearer {data['access_token']}"},
        json={"refresh_token": data["refresh_token"]},
    )
    assert r2.status_code == 200
    r3 = client.post("/api/admin/refresh", json={"refresh_token": data["refresh_token"]})
    assert r3.status_code == 401


def test_me_requires_auth(client):
    r = client.get("/api/admin/me")
    assert r.status_code == 401


def test_me_returns_permissions(client, admin_auth):
    r = client.get("/api/admin/me", headers=admin_auth)
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["username"] == "admin"
    assert data["role_name"] == "super_admin"
    assert data["role_permissions"]  # 权限矩阵非空
