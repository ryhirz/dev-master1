"""M5 留言限频测试（P1：10/min，按 IP 内存级）。

注意：`_rate` 为模块级全局字典（routers/public.py），跨测试模块共享；
此处先清空计数，避免受 test_m2_smoke 的限频用例影响（60s 窗口内）。
"""
from app.routers import public as public_router


def _clear_rate():
    public_router._rate.clear()


def _post(client, i):
    return client.post(
        "/api/inquiries",
        json={"type": "contact", "name": f"用户{i}", "phone": f"1380000{i:04d}", "content": "限频测试"},
    )


def test_inquiry_rate_limit(client):
    _clear_rate()
    # 前 10 次成功
    for i in range(10):
        r = _post(client, i)
        assert r.status_code == 200, f"第 {i+1} 次应成功: {r.text}"
    # 第 11 次触发 429
    r = _post(client, 99)
    assert r.status_code == 429
    assert r.json()["code"] == 429


def test_inquiry_validations(client):
    _clear_rate()
    # 缺 phone → 422
    r = client.post("/api/inquiries", json={"type": "contact", "name": "x"})
    assert r.status_code == 422
    # job_application 缺 job_id → 400
    r = client.post(
        "/api/inquiries",
        json={"type": "job_application", "name": "x", "phone": "13800001111", "content": "求职"},
    )
    assert r.status_code == 400
