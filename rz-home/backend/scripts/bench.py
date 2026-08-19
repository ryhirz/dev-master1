"""M5 性能基准：核心接口 P50/P95 延迟（目标 P95<500ms，对齐《实施方案》§十 M5 验收）。

用法（需后端已启动，默认 :8000）：
    python scripts/bench.py [base_url] [rounds]
"""
import statistics
import sys
import time
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
ROUNDS = int(sys.argv[2]) if len(sys.argv) > 2 else 30


def _timed(fn, n=ROUNDS):
    lat = []
    for _ in range(n):
        t0 = time.perf_counter()
        fn()
        lat.append((time.perf_counter() - t0) * 1000)  # ms
    lat.sort()
    p50 = statistics.median(lat)
    p95 = lat[min(len(lat) - 1, int(len(lat) * 0.95))]
    return {"n": n, "p50_ms": round(p50, 2), "p95_ms": round(p95, 2), "avg_ms": round(statistics.mean(lat), 2)}


def _get(path):
    with urllib.request.urlopen(BASE + path, timeout=10) as r:
        return r.status


def main():
    print(f"基准目标：P95 < 500ms  (base={BASE}, rounds={ROUNDS})")
    print("=" * 52)

    def login():
        data = '{"username":"admin","password":"admin123"}'.encode()
        req = urllib.request.Request(BASE + "/api/admin/login", data=data,
                                     headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status

    cases = [
        ("GET  /api/health", lambda: _get("/api/health")),
        ("POST /api/admin/login", login),
        ("GET  /api/products?page=1&page_size=10", lambda: _get("/api/products?page=1&page_size=10")),
        ("GET  /api/home/overview", lambda: _get("/api/home/overview")),
    ]

    results = []
    ok = True
    for name, fn in cases:
        r = _timed(fn)
        results.append((name, r))
        flag = "OK" if r["p95_ms"] < 500 else "FAIL"
        if flag == "FAIL":
            ok = False
        print(f"{flag}  {name:<40} p50={r['p50_ms']:>8}ms  p95={r['p95_ms']:>8}ms  avg={r['avg_ms']:>8}ms")
    print("=" * 52)
    print("ALL P95 < 500ms ✓" if ok else "存在 P95 >= 500ms 的接口，需优化")


if __name__ == "__main__":
    main()
