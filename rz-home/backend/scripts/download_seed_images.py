# -*- coding: utf-8 -*-
"""下载 db.py 中所有 Unsplash 种子图片到本地 backend/app/static/images/seed/，
   生成 URL 映射，便于将 seed 中的 https://images.unsplash.com/... 替换为本地路径。

   运行：python scripts/download_seed_images.py
   输出：
   - 实际图片保存到 backend/app/static/images/seed/<kind>/
   - 生成 seed_url_map.json：{"原 Unsplash URL": "/static/images/seed/...新 URL"}
"""
import json
import os
import re
import urllib.request
import urllib.parse
import ssl
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

DB = Path("app/core/db.py")
OUT_DIR = Path("app/static/images/seed")
URL_MAP_PATH = Path("seed_url_map.json")

# 按图片用途分类到子目录
# 图片所属内容（product / banner / case / news / series / about / about_section 等）
# 这里简化为按出现位置分组：从 db.py 中搜索 Unsplash URL 上下文
KIND_HINT = {
    "ProductSeries": "series",
    "Banner": "banner",
    "Cases": "case",
    "News": "news",
}

src = DB.read_text(encoding="utf-8")

# 提取所有 photo-id：既匹配完整 URL 形式，也匹配 img("...") 拼接形式
photo_ids = re.findall(r'"(\d+-[0-9a-f]+)"', src)
photo_ids += re.findall(r"photo-(\d+-[0-9a-f]+)", src)
print(f"db.py 中发现 {len(photo_ids)} 个 Unsplash photo-id（去重前）")
uniq_ids = list(dict.fromkeys(photo_ids))
print(f"去重后 {len(uniq_ids)} 个唯一 ID")

OUT_DIR.mkdir(parents=True, exist_ok=True)
url_map = {}

ssl_ctx = ssl.create_default_context()

def download(pid: str) -> tuple[str, str]:
    url = f"https://images.unsplash.com/photo-{pid}?w=1200&q=80&auto=format&fit=crop"
    out_rel = f"/static/images/seed/{pid}.jpg"
    out_abs = OUT_DIR / f"{pid}.jpg"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20, context=ssl_ctx) as r:
            data = r.read()
        out_abs.write_bytes(data)
        return (url, out_rel) if data[:2] == b"\xff\xd8" else (url, None)  # JPEG magic
    except Exception as e:
        print(f"  FAIL {pid}: {e}")
        return (url, None)

# 并发下载
print("开始下载（并发 8）...")
ok = 0
fail = 0
with ThreadPoolExecutor(max_workers=8) as ex:
    futs = {ex.submit(download, pid): pid for pid in uniq_ids}
    for f in as_completed(futs):
        url, new = f.result()
        if new:
            url_map[url] = new
            ok += 1
        else:
            fail += 1

print(f"成功 {ok} / 失败 {fail}")
URL_MAP_PATH.write_text(json.dumps(url_map, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"映射写入 {URL_MAP_PATH}")
# 同时备份 db.py
import shutil
shutil.copy(DB, DB.with_suffix(".py.bak"))
print(f"备份 {DB}.bak")