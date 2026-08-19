"""依赖注入：当前管理员鉴权 + 模块级角色权限校验。

- get_current_admin：解码 Access Token → 查 admin_user 并校验 active；返回 ORM 对象。
- require_role(module, action)：工厂，校验 role.permissions 是否含该模块动作。
  权限矩阵键见《开发技术文档》§4.7.D / 《数据库设计文档》附录 D；
  permissions 形如 {"products":["read","write"]}，'*' 表示全模块全动作。
"""
from typing import List, Optional

from fastapi import Depends, Header, HTTPException
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import decode_token
from app.models.system import AdminUser, Role


def get_current_admin(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> AdminUser:
    """校验 Access Token，返回 active 的 AdminUser。失败抛 401。"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登录或令牌缺失")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token, expected_type="access")
    except JWTError:
        raise HTTPException(status_code=401, detail="令牌无效或已过期")

    admin_id = payload.get("sub")
    admin = db.get(AdminUser, int(admin_id)) if admin_id is not None else None
    if admin is None:
        raise HTTPException(status_code=401, detail="账户不存在")
    if admin.status != "active":
        raise HTTPException(status_code=401, detail="账户已禁用")
    return admin


def _has_permission(role: Optional[Role], module: str, action: str) -> bool:
    if role is None or not role.permissions:
        return False
    perms: dict = role.permissions
    if "*" in perms:
        return True
    return action in perms.get(module, [])


def require_role(module: str, action: str = "read"):
    """模块级权限依赖工厂。越权抛 403（错误码 2003）。"""

    def _dep(admin: AdminUser = Depends(get_current_admin)) -> AdminUser:
        # admin 已绑定请求级 session，role 关系可安全懒加载
        role = admin.role
        if not _has_permission(role, module, action):
            raise HTTPException(status_code=403, detail="无权限访问该模块")
        return admin

    return _dep
