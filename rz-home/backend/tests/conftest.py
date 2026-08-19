"""pytest 公共 fixture：测试数据库重置 + TestClient（lifespan 自动建表种子）+ 三角色登录头。

注意：测试用 SQLite 独立库（test_rz_home.db），每个模块级 client 触发 drop_all+create_all+seed，
各测试模块互不影响（pytest 串行执行）。
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


@pytest.fixture(scope="module")
def client():
    from app import models  # 触发元数据注册

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:  # lifespan(ENV=dev) 自动 init_db + seed（三角色+演示账号+目录数据）
        yield c


def _login(c: TestClient, username: str, password: str) -> dict:
    r = c.post("/api/admin/login", json={"username": username, "password": password})
    assert r.status_code == 200, f"登录失败 {username}: {r.text}"
    token = r.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def admin_auth(client):
    return _login(client, "admin", "admin123")


@pytest.fixture(scope="module")
def editor_auth(client):
    return _login(client, "editor", "editor123")


@pytest.fixture(scope="module")
def cshr_auth(client):
    return _login(client, "cs_hr", "cshr123")
