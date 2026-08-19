"""Pydantic schema 包：统一导出。"""
from app.schemas.catalog import (
    ProductSeriesCreate, ProductSeriesUpdate, ProductSeriesOut,
    CategoryCreate, CategoryUpdate, CategoryOut,
    ProductCreate, ProductUpdate, ProductOut,
)
from app.schemas.content import (
    CaseCreate, CaseUpdate, CaseOut,
    NewsCreate, NewsUpdate, NewsOut,
    BannerCreate, BannerUpdate, BannerOut,
    AboutSectionCreate, AboutSectionUpdate, AboutSectionOut,
    MilestoneCreate, MilestoneUpdate, MilestoneOut,
    CompanyInfoUpdate, CompanyInfoOut,
)
from app.schemas.crm import (
    JobCreate, JobUpdate, JobOut,
    MessageUpdate, MessageOut, InquiryCreate, InquiryOut,
)
from app.schemas.system import (
    RoleCreate, RoleUpdate, RoleOut,
    AdminUserCreate, AdminUserUpdate, AdminUserOut,
    LoginRequest, TokenResponse, AdminMeOut, RefreshRequest,
)

__all__ = [
    "ProductSeriesCreate", "ProductSeriesUpdate", "ProductSeriesOut",
    "CategoryCreate", "CategoryUpdate", "CategoryOut",
    "ProductCreate", "ProductUpdate", "ProductOut",
    "CaseCreate", "CaseUpdate", "CaseOut",
    "NewsCreate", "NewsUpdate", "NewsOut",
    "BannerCreate", "BannerUpdate", "BannerOut",
    "AboutSectionCreate", "AboutSectionUpdate", "AboutSectionOut",
    "MilestoneCreate", "MilestoneUpdate", "MilestoneOut",
    "CompanyInfoUpdate", "CompanyInfoOut",
    "JobCreate", "JobUpdate", "JobOut",
    "MessageUpdate", "MessageOut", "InquiryCreate", "InquiryOut",
    "RoleCreate", "RoleUpdate", "RoleOut",
    "AdminUserCreate", "AdminUserUpdate", "AdminUserOut",
    "LoginRequest", "TokenResponse", "AdminMeOut", "RefreshRequest",
]
