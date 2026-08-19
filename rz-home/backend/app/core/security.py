"""安全工具：JWT（Access/Refresh + jti 吊销） + bcrypt 密码哈希。

- Access Token：30min，携带于 Authorization: Bearer。
- Refresh Token：7d，含 jti；登出时加入内存黑名单。
- 密码：passlib bcrypt（cost 默认 ≥12）。
详见《开发技术文档》§5 鉴权约定。
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 内存级 refresh 黑名单（jti 集合）。生产可换 Redis；重启即清空（可接受，refresh 7d 风险低）。
refresh_blacklist: set[str] = set()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "type": token_type,
        "jti": uuid.uuid4().hex,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(subject: str) -> str:
    return _create_token(
        subject, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), "access"
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        subject, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), "refresh"
    )


def decode_token(token: str, expected_type: Optional[str] = None) -> dict:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    if expected_type and payload.get("type") != expected_type:
        raise JWTError("invalid token type")
    return payload


def revoke_refresh(token: str) -> None:
    """将 refresh token 的 jti 加入黑名单（登出时调用）。"""
    try:
        payload = decode_token(token, expected_type="refresh")
        refresh_blacklist.add(payload.get("jti"))
    except JWTError:
        # 失效/非法 token 无需处理
        pass


def is_refresh_revoked(token: str) -> bool:
    """校验 refresh token 是否已被吊销。"""
    try:
        payload = decode_token(token, expected_type="refresh")
    except JWTError:
        return True
    return payload.get("jti") in refresh_blacklist
