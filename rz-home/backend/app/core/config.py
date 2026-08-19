"""全局配置（从环境变量读取，缺省本地 dev / SQLite）。

技术栈与可移植性约定见《开发技术文档》§2 / 实施方案 §2、§4：
- DATABASE_URL 切换 Dev SQLite / Prod PostgreSQL，代码零改动。
- SECRET_KEY、CORS 等敏感项均走环境变量（Prod 不落库明文）。
"""
import os
from typing import List

from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "Rz家居 API"
    API_V1_PREFIX: str = "/api"
    ADMIN_PREFIX: str = "/api/admin"

    ENV: str = os.getenv("ENV", "dev")  # dev / test / prod
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # 数据库：Dev SQLite / Prod PostgreSQL（双库可移植核心）
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./rz_home.db")

    # 安全
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_ME_IN_PROD_rz_home_secret")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS（本地联调：web=5173, admin=5174）
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:5174"
    )

    # 上传
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "..", "app", "static", "uploads")
    MAX_UPLOAD_MB: int = 10
    ALLOWED_IMAGE_EXT: tuple = (".jpg", ".jpeg", ".png", ".webp", ".gif")

    # 限频（P1：留言 10/min，无验证码；见实施方案 §12 D）
    MESSAGE_RATE_LIMIT_PER_MIN: int = 10

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
