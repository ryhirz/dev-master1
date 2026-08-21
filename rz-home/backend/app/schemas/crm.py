"""互动域 Pydantic 模型：招聘职位 / 留言（含公开发起接口 InquiryCreate）。

枚举值在 schema 层校验（DB 不建 CHECK，见《数据库设计文档》§2.3）。
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.sanitize import sanitize_html


# ---------------- 招聘职位 ----------------
class JobCreate(BaseModel):
    type: str = "social"  # social | campus
    title: str = Field(max_length=200)
    department: Optional[str] = Field(default=None, max_length=80)
    city: Optional[str] = Field(default=None, max_length=80)
    salary: Optional[str] = Field(default=None, max_length=80)
    description: Optional[str] = None
    requirements: Optional[str] = None
    headcount: Optional[int] = None
    status: str = "active"
    publish_at: Optional[datetime] = None

    @field_validator("description", "requirements")
    @classmethod
    def _sanitize_text(cls, v):
        return sanitize_html(v)


class JobUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = Field(default=None, max_length=200)
    department: Optional[str] = Field(default=None, max_length=80)
    city: Optional[str] = Field(default=None, max_length=80)
    salary: Optional[str] = Field(default=None, max_length=80)
    description: Optional[str] = None
    requirements: Optional[str] = None
    headcount: Optional[int] = None
    status: Optional[str] = None
    publish_at: Optional[datetime] = None

    @field_validator("description", "requirements")
    @classmethod
    def _sanitize_text(cls, v):
        return sanitize_html(v)


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    title: str
    department: Optional[str] = None
    city: Optional[str] = None
    salary: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    headcount: Optional[int] = None
    status: str
    publish_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------- 留言 / 线索 ----------------
# 后台管理用：列表/详情/更新
class MessageUpdate(BaseModel):
    status: Optional[str] = None  # new | handled | ignored
    reply: Optional[str] = None


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    ref_id: Optional[int] = None
    job_title: Optional[str] = None
    name: str
    phone: str
    email: Optional[str] = None
    content: str
    status: str
    reply: Optional[str] = None
    replied_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# 公开发起留言 / 求职意向（前端提交）
class InquiryCreate(BaseModel):
    type: str = "contact"  # contact | job_application
    name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=1, max_length=40)
    email: Optional[str] = Field(default=None, max_length=160)
    content: str = Field(min_length=1)
    job_id: Optional[int] = None  # type=job_application 时关联 job.id


class InquiryOut(BaseModel):
    id: int
    type: str
