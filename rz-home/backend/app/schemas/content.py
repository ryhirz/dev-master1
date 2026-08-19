"""内容域 Pydantic 模型：案例 / 新闻 / 轮播 / 关于板块 / 发展历程 / 公司信息。

枚举值在 schema 层校验（DB 不建 CHECK，见《数据库设计文档》§2.3）。
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------- 案例 ----------------
class CaseCreate(BaseModel):
    title: str = Field(max_length=200)
    category: str = "住宅"  # 住宅 | 工程 | 商业
    cover_image: Optional[str] = Field(default=None, max_length=512)
    images: List[str] = Field(default_factory=list)
    summary: Optional[str] = None
    content: Optional[str] = None
    is_new: bool = False
    sort_order: int = 0
    status: str = "active"


class CaseUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    category: Optional[str] = None
    cover_image: Optional[str] = Field(default=None, max_length=512)
    images: Optional[List[str]] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    is_new: Optional[bool] = None
    sort_order: Optional[int] = None
    status: Optional[str] = None


class CaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    category: str
    cover_image: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    summary: Optional[str] = None
    content: Optional[str] = None
    is_new: bool = False
    sort_order: int
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------- 新闻 ----------------
class NewsCreate(BaseModel):
    title: str = Field(max_length=200)
    category: str = "company"  # company | industry
    cover_image: Optional[str] = Field(default=None, max_length=512)
    summary: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = Field(default=None, max_length=80)
    is_top: bool = False
    status: str = "draft"  # draft | published
    published_at: Optional[datetime] = None


class NewsUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    category: Optional[str] = None
    cover_image: Optional[str] = Field(default=None, max_length=512)
    summary: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = Field(default=None, max_length=80)
    is_top: Optional[bool] = None
    status: Optional[str] = None
    published_at: Optional[datetime] = None


class NewsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    category: str
    cover_image: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    is_top: bool = False
    status: str
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------- 轮播 ----------------
class BannerCreate(BaseModel):
    title: str = Field(max_length=200)
    image: str = Field(max_length=512)
    link_url: Optional[str] = Field(default=None, max_length=512)
    sort_order: int = 0
    status: str = "active"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class BannerUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    image: Optional[str] = Field(default=None, max_length=512)
    link_url: Optional[str] = Field(default=None, max_length=512)
    sort_order: Optional[int] = None
    status: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class BannerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    image: str
    link_url: Optional[str] = None
    sort_order: int
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------- 关于我们板块 ----------------
class AboutSectionCreate(BaseModel):
    code: str = Field(max_length=20)  # overview | brand
    title: str = Field(max_length=200)
    content: Optional[str] = None
    cover_image: Optional[str] = Field(default=None, max_length=512)
    sort_order: int = 0
    status: str = "active"


class AboutSectionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    content: Optional[str] = None
    cover_image: Optional[str] = Field(default=None, max_length=512)
    sort_order: Optional[int] = None
    status: Optional[str] = None


class AboutSectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    title: str
    content: Optional[str] = None
    cover_image: Optional[str] = None
    sort_order: int
    status: str
    updated_at: Optional[datetime] = None


# ---------------- 发展历程 ----------------
class MilestoneCreate(BaseModel):
    year: str = Field(max_length=20)
    title: str = Field(max_length=200)
    description: Optional[str] = None
    image: Optional[str] = Field(default=None, max_length=512)
    sort_order: int = 0
    status: str = "active"


class MilestoneUpdate(BaseModel):
    year: Optional[str] = Field(default=None, max_length=20)
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = None
    image: Optional[str] = Field(default=None, max_length=512)
    sort_order: Optional[int] = None
    status: Optional[str] = None


class MilestoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    year: str
    title: str
    description: Optional[str] = None
    image: Optional[str] = None
    sort_order: int
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------- 公司信息（单行 id=1） ----------------
class CompanyInfoUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    logo_url: Optional[str] = Field(default=None, max_length=512)
    founded_year: Optional[int] = None
    honor_count: Optional[int] = None
    production_line_count: Optional[int] = None
    address: Optional[str] = Field(default=None, max_length=300)
    phone: Optional[str] = Field(default=None, max_length=40)
    email: Optional[str] = Field(default=None, max_length=160)
    wechat: Optional[str] = Field(default=None, max_length=80)
    icp_no: Optional[str] = Field(default=None, max_length=40)
    intro: Optional[str] = None


class CompanyInfoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    logo_url: Optional[str] = None
    founded_year: Optional[int] = None
    honor_count: Optional[int] = None
    production_line_count: Optional[int] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    wechat: Optional[str] = None
    icp_no: Optional[str] = None
    intro: Optional[str] = None
    updated_at: Optional[datetime] = None
