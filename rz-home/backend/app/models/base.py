"""声明式基类（全项目 ORM 模型统一继承）。"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """所有 ORM 模型的基类。M2 各模型文件继承此类。"""
