"""通用 Pydantic 模型：分页信封、通用响应等。"""
from typing import Generic, List, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """分页响应结构（对齐《开发技术文档》§5：{items,page,page_size,total}）。"""

    items: List[T]
    page: int
    page_size: int
    total: int


class Msg(BaseModel):
    detail: str
