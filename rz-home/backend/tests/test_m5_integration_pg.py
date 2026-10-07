"""M5 PG 集成测试（CI 专用）：设置 PG_DATABASE_URL 才运行，本机未设置则跳过。

本地（SQLite）单测全绿为默认验证；生产 PG 集成在 GitHub Actions 的 postgres service 上执行。
运行示例：
    PG_DATABASE_URL=postgresql+psycopg2://rz:rzpwd@localhost:5432/rz_home pytest tests/test_m5_integration_pg.py -m integration
"""
import os

import pytest

pytestmark = pytest.mark.integration

PG_URL = os.environ.get("PG_DATABASE_URL")


@pytest.fixture(scope="module")
def pg_engine():
    if not PG_URL:
        pytest.skip("未设置 PG_DATABASE_URL，跳过 PG 集成测试（本机以 SQLite 单测为准）")
    from sqlalchemy import create_engine

    return create_engine(PG_URL)


def test_pg_connect_and_tables(pg_engine):
    from sqlalchemy import inspect, text

    with pg_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    insp = inspect(pg_engine)
    tables = insp.get_table_names()
    # 核心表必须存在（迁移已执行）。
    # 注意：表名与 ORM 的 __tablename__ 一致，为单数形式（admin_user / product / ...），
    # 不要写成复数，否则断言会在真实 PG 上失败。
    assert {"role", "admin_user", "product", "cases", "news", "job", "message"} <= set(tables)
    # 迁移应建满 14 张表
    assert len(tables) >= 14, f"迁移后应有 14 张表，实际 {len(tables)}：{sorted(tables)}"


def test_pg_seed_accounts(pg_engine):
    from sqlalchemy import text

    with pg_engine.connect() as conn:
        rows = conn.execute(text("SELECT username FROM admin_user WHERE status='active'")).fetchall()
    names = {r[0] for r in rows}
    assert "admin" in names
