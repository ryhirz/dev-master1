"""ORM 模型包：导入全部模型模块以注册元数据（init_db / Alembic 使用）。

导入顺序无关，仅用于触发各模块的类定义注册到 Base.metadata。
"""
from app.models.catalog import ProductSeries, Category, Product
from app.models.content import Cases, News, Banner, AboutSection, Milestone, CompanyInfo
from app.models.crm import Job, Message
from app.models.system import Role, AdminUser, AuditLog

__all__ = [
    "ProductSeries", "Category", "Product",
    "Cases", "News", "Banner", "AboutSection", "Milestone", "CompanyInfo",
    "Job", "Message",
    "Role", "AdminUser", "AuditLog",
]
