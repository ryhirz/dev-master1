"""目录域 Pydantic 模型：产品系列 / 分类 / 产品。

枚举值在 schema 层校验（DB 不建 CHECK，见《数据库设计文档》§2.3）。
"""
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.sanitize import sanitize_html

ActiveHidden = str  # 仅占位，使用 Literal 在字段级约束


# ---------------- 产品系列 ----------------
class ProductSeriesCreate(BaseModel):
    name: str = Field(max_length=120)
    slug: str = Field(max_length=160)
    description: Optional[str] = None
    cover_image: Optional[str] = Field(default=None, max_length=512)
    sort_order: int = 0
    status: str = "active"


class ProductSeriesUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    slug: Optional[str] = Field(default=None, max_length=160)
    description: Optional[str] = None
    cover_image: Optional[str] = Field(default=None, max_length=512)
    sort_order: Optional[int] = None
    status: Optional[str] = None


class ProductSeriesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    sort_order: int
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------- 空间分类（自引用） ----------------
class CategoryCreate(BaseModel):
    name: str = Field(max_length=120)
    slug: str = Field(max_length=160)
    parent_id: Optional[int] = None
    sort_order: int = 0
    status: str = "active"


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    slug: Optional[str] = Field(default=None, max_length=160)
    parent_id: Optional[int] = None
    sort_order: Optional[int] = None
    status: Optional[str] = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    parent_id: Optional[int] = None
    parent_name: Optional[str] = None
    sort_order: int
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------- 产品 ----------------
class ProductCreate(BaseModel):
    series_id: Optional[int] = None
    category_id: Optional[int] = None
    name: str = Field(max_length=200)
    model_no: Optional[str] = Field(default=None, max_length=80)
    summary: Optional[str] = None
    description: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    specs: Dict[str, object] = Field(default_factory=dict)
    price: Optional[float] = None
    is_recommended: bool = False
    status: str = "active"

    @field_validator("description")
    @classmethod
    def _sanitize_description(cls, v):
        return sanitize_html(v)


class ProductUpdate(BaseModel):
    series_id: Optional[int] = None
    category_id: Optional[int] = None
    name: Optional[str] = Field(default=None, max_length=200)
    model_no: Optional[str] = Field(default=None, max_length=80)
    summary: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    specs: Optional[Dict[str, object]] = None
    price: Optional[float] = None
    is_recommended: Optional[bool] = None
    status: Optional[str] = None

    @field_validator("description")
    @classmethod
    def _sanitize_description(cls, v):
        return sanitize_html(v)


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    series_id: Optional[int] = None
    category_id: Optional[int] = None
    series_name: Optional[str] = None
    category_name: Optional[str] = None
    name: str
    model_no: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    specs: Dict[str, object] = Field(default_factory=dict)
    price: Optional[float] = None
    is_recommended: bool = False
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
