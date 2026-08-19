"""种子脚本：建表 + 幂等插入基础数据（角色三行 / 公司信息单行 / 默认超管）。

用法（在 backend/ 目录下）：
    python -m scripts.seed
或：
    python scripts/seed.py

默认超管：admin / admin123（首次部署务必改密；密码经 bcrypt cost≥12 哈希）。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import init_db, seed


def main() -> None:
    init_db()
    seed()
    print("[seed] 已完成：角色、公司信息(id=1)、默认超管(admin/admin123) 已就绪（幂等）。")


if __name__ == "__main__":
    main()
