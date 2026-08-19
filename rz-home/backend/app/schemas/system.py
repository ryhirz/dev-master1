"""系统域 Pydantic 模型：角色 / 管理员 / 鉴权令牌。

枚举值在 schema 层校验（DB 不建 CHECK，见《数据库设计文档》§2.3）。
"""
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------- 角色 ----------------
class RoleCreate(BaseModel):
    name: str = Field(max_length=80)  # super_admin | editor | cs_hr
    permissions: Dict[str, List[str]] = Field(default_factory=dict)


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=80)
    permissions: Optional[Dict[str, List[str]]] = None


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    permissions: Dict[str, List[str]] = Field(default_factory=dict)


# ---------------- 管理员 ----------------
class AdminUserCreate(BaseModel):
    username: str = Field(max_length=80)
    password: str = Field(min_length=6)
    display_name: Optional[str] = Field(default=None, max_length=120)
    role_id: int
    status: str = "active"  # active | disabled


class AdminUserUpdate(BaseModel):
    password: Optional[str] = Field(default=None, min_length=6)
    display_name: Optional[str] = Field(default=None, max_length=120)
    role_id: Optional[int] = None
    status: Optional[str] = None


class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    display_name: Optional[str] = None
    role_id: int
    role_name: Optional[str] = None
    status: str
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


# ---------------- 鉴权 ----------------
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    admin: AdminUserOut


class AdminMeOut(BaseModel):
    id: int
    username: str
    display_name: Optional[str] = None
    role_name: Optional[str] = None
    role_permissions: Dict[str, List[str]] = Field(default_factory=dict)
    status: str


class RefreshRequest(BaseModel):
    refresh_token: str
