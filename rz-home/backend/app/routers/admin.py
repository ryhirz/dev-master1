"""管理接口（JWT 必需，require_role 授权）— 鉴权 + 各模块 CRUD + 上传 + 统计。

路径前缀 /api/admin。除 login/refresh 外均需要 Bearer Access Token。
权限矩阵键见《开发技术文档》§4.7.D / 《数据库设计文档》附录 D。
删除统一走软删除（status 标记），仅 role 无 status 字段做物理删除（FK RESTRICT 保护）。
写操作记录 audit_log。
"""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request
from jose import JWTError
from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.response import ok
from app.core.security import (
    create_access_token, create_refresh_token, decode_token,
    verify_password, revoke_refresh, is_refresh_revoked,
)
from app.core.config import settings
from app.deps.common import get_current_admin, require_role
from app.models.catalog import ProductSeries, Category, Product
from app.models.content import Cases, News, Banner, AboutSection, Milestone, CompanyInfo
from app.models.crm import Job, Message
from app.models.system import Role, AdminUser
from app.services.audit import log_action
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
    JobCreate, JobUpdate, JobOut, MessageUpdate, MessageOut,
)
from app.schemas.system import (
    RoleCreate, RoleUpdate, RoleOut,
    AdminUserCreate, AdminUserUpdate, AdminUserOut,
    LoginRequest, TokenResponse, AdminMeOut, RefreshRequest,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

AUTH = [Depends(get_current_admin)]


# ---------------- 辅助 ----------------
def _admin_out(admin: AdminUser) -> AdminUserOut:
    o = AdminUserOut.model_validate(admin)
    o.role_name = admin.role.name if admin.role else None
    return o


def _page(items: list, total: int, page: int, page_size: int) -> dict:
    return {"items": items, "page": page, "page_size": page_size, "total": total}


def _product_enrich(db: Session, p: Product) -> dict:
    series_map = {s.id: s.name for s in db.query(ProductSeries).all()}
    cat_map = {c.id: c.name for c in db.query(Category).all()}
    d = ProductOut.model_validate(p).model_dump()
    d["series_name"] = series_map.get(p.series_id)
    d["category_name"] = cat_map.get(p.category_id)
    return d


# ---------------- 鉴权 ----------------
@router.post("/login", summary="管理员登录（公开）")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.username == body.username).first()
    if not admin or not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    if admin.status != "active":
        raise HTTPException(status_code=401, detail="账户已禁用")

    admin.last_login_at = datetime.now(timezone.utc)
    db.add(admin)
    log_action(db, admin.id, "login")
    db.commit()

    access = create_access_token(str(admin.id))
    refresh = create_refresh_token(str(admin.id))
    return ok(data=TokenResponse(
        access_token=access, refresh_token=refresh, admin=_admin_out(admin)
    ).model_dump())


@router.post("/refresh", summary="刷新 Access Token（公开）")
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    if is_refresh_revoked(body.refresh_token):
        raise HTTPException(status_code=401, detail="refresh 已失效")
    try:
        payload = decode_token(body.refresh_token, expected_type="refresh")
    except JWTError:
        raise HTTPException(status_code=401, detail="refresh 无效")
    admin = db.get(AdminUser, int(payload.get("sub")))
    if admin is None or admin.status != "active":
        raise HTTPException(status_code=401, detail="账户不存在或已禁用")
    access = create_access_token(str(admin.id))
    return ok(data={"access_token": access, "token_type": "bearer"})


@router.post("/logout", summary="登出（吊销 Refresh）", dependencies=AUTH)
def logout(body: RefreshRequest):
    revoke_refresh(body.refresh_token)
    return ok(message="已登出")


@router.get("/me", summary="当前管理员信息", dependencies=AUTH)
def me(admin: AdminUser = Depends(get_current_admin)):
    role = admin.role
    return ok(data=AdminMeOut(
        id=admin.id, username=admin.username, display_name=admin.display_name,
        role_name=role.name if role else None,
        role_permissions=role.permissions if role else {},
        status=admin.status,
    ).model_dump())


# ---------------- 产品系列 ----------------
@router.get("/series", summary="系列列表", dependencies=[Depends(require_role("product_series", "read"))])
def list_series(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    q = db.query(ProductSeries)
    total = q.count()
    rows = q.order_by(ProductSeries.sort_order, ProductSeries.id).offset((page-1)*page_size).limit(page_size).all()
    items = [ProductSeriesOut.model_validate(r).model_dump() for r in rows]
    return ok(data=_page(items, total, page, page_size))


@router.post("/series", summary="新建系列", dependencies=[Depends(require_role("product_series", "write"))])
def create_series(body: ProductSeriesCreate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = ProductSeries(**body.model_dump())
    db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="slug 已存在")
    db.refresh(obj)
    log_action(db, admin.id, "create", "product_series", obj.id)
    db.commit()
    return ok(data=ProductSeriesOut.model_validate(obj).model_dump())


@router.get("/series/{sid}", summary="系列详情", dependencies=[Depends(require_role("product_series", "read"))])
def get_series(sid: int, db: Session = Depends(get_db)):
    obj = db.get(ProductSeries, sid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    return ok(data=ProductSeriesOut.model_validate(obj).model_dump())


@router.put("/series/{sid}", summary="更新系列", dependencies=[Depends(require_role("product_series", "write"))])
def update_series(sid: int, body: ProductSeriesUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(ProductSeries, sid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="slug 已存在")
    db.refresh(obj)
    log_action(db, admin.id, "update", "product_series", obj.id)
    db.commit()
    return ok(data=ProductSeriesOut.model_validate(obj).model_dump())


@router.delete("/series/{sid}", summary="删除系列（软删）", dependencies=[Depends(require_role("product_series", "write"))])
def delete_series(sid: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(ProductSeries, sid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    obj.status = "hidden"
    db.add(obj)
    log_action(db, admin.id, "delete", "product_series", obj.id)
    db.commit()
    return ok(message="已删除")


# ---------------- 产品分类（自引用） ----------------
@router.get("/categories", summary="分类列表", dependencies=[Depends(require_role("category", "read"))])
def list_categories(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    q = db.query(Category)
    total = q.count()
    rows = q.order_by(Category.sort_order, Category.id).offset((page-1)*page_size).limit(page_size).all()
    pmap = {c.id: c.name for c in rows}
    items = []
    for r in rows:
        d = CategoryOut.model_validate(r).model_dump()
        d["parent_name"] = pmap.get(r.parent_id)
        items.append(d)
    return ok(data=_page(items, total, page, page_size))


@router.post("/categories", summary="新建分类", dependencies=[Depends(require_role("category", "write"))])
def create_category(body: CategoryCreate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = Category(**body.model_dump())
    db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="slug 已存在")
    db.refresh(obj)
    log_action(db, admin.id, "create", "category", obj.id)
    db.commit()
    return ok(data=CategoryOut.model_validate(obj).model_dump())


@router.get("/categories/{cid}", summary="分类详情", dependencies=[Depends(require_role("category", "read"))])
def get_category(cid: int, db: Session = Depends(get_db)):
    obj = db.get(Category, cid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    return ok(data=CategoryOut.model_validate(obj).model_dump())


@router.put("/categories/{cid}", summary="更新分类", dependencies=[Depends(require_role("category", "write"))])
def update_category(cid: int, body: CategoryUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Category, cid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="slug 已存在")
    db.refresh(obj)
    log_action(db, admin.id, "update", "category", obj.id)
    db.commit()
    return ok(data=CategoryOut.model_validate(obj).model_dump())


@router.delete("/categories/{cid}", summary="删除分类（软删）", dependencies=[Depends(require_role("category", "write"))])
def delete_category(cid: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Category, cid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    obj.status = "hidden"
    db.add(obj)
    log_action(db, admin.id, "delete", "category", obj.id)
    db.commit()
    return ok(message="已删除")


# ---------------- 产品 ----------------
@router.get("/products", summary="产品列表", dependencies=[Depends(require_role("product", "read"))])
def list_products(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Product)
    if status:
        q = q.filter(Product.status == status)
    total = q.count()
    rows = q.order_by(desc(Product.is_recommended), desc(Product.created_at)).offset((page-1)*page_size).limit(page_size).all()
    items = [_product_enrich(db, r) for r in rows]
    return ok(data=_page(items, total, page, page_size))


@router.post("/products", summary="新建产品", dependencies=[Depends(require_role("product", "write"))])
def create_product(body: ProductCreate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = Product(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "create", "product", obj.id)
    db.commit()
    return ok(data=_product_enrich(db, obj))


@router.get("/products/{pid}", summary="产品详情", dependencies=[Depends(require_role("product", "read"))])
def get_product(pid: int, db: Session = Depends(get_db)):
    obj = db.get(Product, pid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    return ok(data=_product_enrich(db, obj))


@router.put("/products/{pid}", summary="更新产品", dependencies=[Depends(require_role("product", "write"))])
def update_product(pid: int, body: ProductUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Product, pid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "update", "product", obj.id)
    db.commit()
    return ok(data=_product_enrich(db, obj))


@router.delete("/products/{pid}", summary="删除产品（软删）", dependencies=[Depends(require_role("product", "write"))])
def delete_product(pid: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Product, pid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    obj.status = "hidden"
    db.add(obj)
    log_action(db, admin.id, "delete", "product", obj.id)
    db.commit()
    return ok(message="已删除")


# ---------------- 案例 ----------------
@router.get("/cases", summary="案例列表", dependencies=[Depends(require_role("cases", "read"))])
def list_cases(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Cases)
    if status:
        q = q.filter(Cases.status == status)
    total = q.count()
    rows = q.order_by(desc(Cases.is_new), desc(Cases.created_at)).offset((page-1)*page_size).limit(page_size).all()
    items = [CaseOut.model_validate(r).model_dump() for r in rows]
    return ok(data=_page(items, total, page, page_size))


@router.post("/cases", summary="新建案例", dependencies=[Depends(require_role("cases", "write"))])
def create_case(body: CaseCreate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = Cases(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "create", "cases", obj.id)
    db.commit()
    return ok(data=CaseOut.model_validate(obj).model_dump())


@router.get("/cases/{cid}", summary="案例详情", dependencies=[Depends(require_role("cases", "read"))])
def get_case(cid: int, db: Session = Depends(get_db)):
    obj = db.get(Cases, cid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    return ok(data=CaseOut.model_validate(obj).model_dump())


@router.put("/cases/{cid}", summary="更新案例", dependencies=[Depends(require_role("cases", "write"))])
def update_case(cid: int, body: CaseUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Cases, cid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "update", "cases", obj.id)
    db.commit()
    return ok(data=CaseOut.model_validate(obj).model_dump())


@router.delete("/cases/{cid}", summary="删除案例（软删）", dependencies=[Depends(require_role("cases", "write"))])
def delete_case(cid: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Cases, cid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    obj.status = "hidden"
    db.add(obj)
    log_action(db, admin.id, "delete", "cases", obj.id)
    db.commit()
    return ok(message="已删除")


# ---------------- 新闻 ----------------
@router.get("/news", summary="新闻列表", dependencies=[Depends(require_role("news", "read"))])
def list_news(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(News)
    if status:
        q = q.filter(News.status == status)
    total = q.count()
    rows = q.order_by(desc(News.is_top), desc(News.published_at), desc(News.created_at)).offset((page-1)*page_size).limit(page_size).all()
    items = [NewsOut.model_validate(r).model_dump() for r in rows]
    return ok(data=_page(items, total, page, page_size))


@router.post("/news", summary="新建新闻", dependencies=[Depends(require_role("news", "write"))])
def create_news(body: NewsCreate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = News(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "create", "news", obj.id)
    db.commit()
    return ok(data=NewsOut.model_validate(obj).model_dump())


@router.get("/news/{nid}", summary="新闻详情", dependencies=[Depends(require_role("news", "read"))])
def get_news(nid: int, db: Session = Depends(get_db)):
    obj = db.get(News, nid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    return ok(data=NewsOut.model_validate(obj).model_dump())


@router.put("/news/{nid}", summary="更新新闻", dependencies=[Depends(require_role("news", "write"))])
def update_news(nid: int, body: NewsUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(News, nid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "update", "news", obj.id)
    db.commit()
    return ok(data=NewsOut.model_validate(obj).model_dump())


@router.delete("/news/{nid}", summary="删除新闻（软删）", dependencies=[Depends(require_role("news", "write"))])
def delete_news(nid: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(News, nid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    obj.status = "hidden"
    db.add(obj)
    log_action(db, admin.id, "delete", "news", obj.id)
    db.commit()
    return ok(message="已删除")


# ---------------- 招聘 ----------------
@router.get("/jobs", summary="职位列表", dependencies=[Depends(require_role("job", "read"))])
def list_jobs(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Job)
    if status:
        q = q.filter(Job.status == status)
    total = q.count()
    rows = q.order_by(desc(Job.created_at)).offset((page-1)*page_size).limit(page_size).all()
    items = [JobOut.model_validate(r).model_dump() for r in rows]
    return ok(data=_page(items, total, page, page_size))


@router.post("/jobs", summary="新建职位", dependencies=[Depends(require_role("job", "write"))])
def create_job(body: JobCreate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = Job(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "create", "job", obj.id)
    db.commit()
    return ok(data=JobOut.model_validate(obj).model_dump())


@router.get("/jobs/{jid}", summary="职位详情", dependencies=[Depends(require_role("job", "read"))])
def get_job(jid: int, db: Session = Depends(get_db)):
    obj = db.get(Job, jid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    return ok(data=JobOut.model_validate(obj).model_dump())


@router.put("/jobs/{jid}", summary="更新职位", dependencies=[Depends(require_role("job", "write"))])
def update_job(jid: int, body: JobUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Job, jid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "update", "job", obj.id)
    db.commit()
    return ok(data=JobOut.model_validate(obj).model_dump())


@router.delete("/jobs/{jid}", summary="删除职位（软删）", dependencies=[Depends(require_role("job", "write"))])
def delete_job(jid: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Job, jid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    obj.status = "hidden"
    db.add(obj)
    log_action(db, admin.id, "delete", "job", obj.id)
    db.commit()
    return ok(message="已删除")


# ---------------- 留言 / 求职意向 ----------------
@router.get("/messages", summary="留言列表", dependencies=[Depends(require_role("message", "read"))])
def list_messages(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), type: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Message)
    if type:
        q = q.filter(Message.type == type)
    if status:
        q = q.filter(Message.status == status)
    total = q.count()
    rows = q.order_by(desc(Message.created_at)).offset((page-1)*page_size).limit(page_size).all()
    job_titles = {j.id: j.title for j in db.query(Job).all()}
    items = []
    for r in rows:
        d = MessageOut.model_validate(r).model_dump()
        d["job_title"] = job_titles.get(r.ref_id) if r.ref_id else None
        items.append(d)
    return ok(data=_page(items, total, page, page_size))


@router.get("/messages/{mid}", summary="留言详情", dependencies=[Depends(require_role("message", "read"))])
def get_message(mid: int, db: Session = Depends(get_db)):
    obj = db.get(Message, mid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    d = MessageOut.model_validate(obj).model_dump()
    if obj.ref_id:
        job = db.get(Job, obj.ref_id)
        d["job_title"] = job.title if job else None
    return ok(data=d)


@router.put("/messages/{mid}", summary="更新留言状态/回复", dependencies=[Depends(require_role("message", "write"))])
def update_message(mid: int, body: MessageUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Message, mid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    data = body.model_dump(exclude_unset=True)
    if "reply" in data and data["reply"] is not None:
        obj.replied_at = datetime.now(timezone.utc)
    for k, v in data.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "update", "message", obj.id)
    db.commit()
    return ok(data=MessageOut.model_validate(obj).model_dump())


@router.delete("/messages/{mid}", summary="删除留言（软删）", dependencies=[Depends(require_role("message", "write"))])
def delete_message(mid: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Message, mid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    obj.status = "ignored"
    db.add(obj)
    log_action(db, admin.id, "delete", "message", obj.id)
    db.commit()
    return ok(message="已删除")


# ---------------- 轮播 ----------------
@router.get("/banners", summary="轮播列表", dependencies=[Depends(require_role("banner", "read"))])
def list_banners(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Banner)
    if status:
        q = q.filter(Banner.status == status)
    total = q.count()
    rows = q.order_by(Banner.sort_order, Banner.id).offset((page-1)*page_size).limit(page_size).all()
    items = [BannerOut.model_validate(r).model_dump() for r in rows]
    return ok(data=_page(items, total, page, page_size))


@router.post("/banners", summary="新建轮播", dependencies=[Depends(require_role("banner", "write"))])
def create_banner(body: BannerCreate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = Banner(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "create", "banner", obj.id)
    db.commit()
    return ok(data=BannerOut.model_validate(obj).model_dump())


@router.get("/banners/{bid}", summary="轮播详情", dependencies=[Depends(require_role("banner", "read"))])
def get_banner(bid: int, db: Session = Depends(get_db)):
    obj = db.get(Banner, bid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    return ok(data=BannerOut.model_validate(obj).model_dump())


@router.put("/banners/{bid}", summary="更新轮播", dependencies=[Depends(require_role("banner", "write"))])
def update_banner(bid: int, body: BannerUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Banner, bid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "update", "banner", obj.id)
    db.commit()
    return ok(data=BannerOut.model_validate(obj).model_dump())


@router.delete("/banners/{bid}", summary="删除轮播（软删）", dependencies=[Depends(require_role("banner", "write"))])
def delete_banner(bid: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Banner, bid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    obj.status = "hidden"
    db.add(obj)
    log_action(db, admin.id, "delete", "banner", obj.id)
    db.commit()
    return ok(message="已删除")


# ---------------- 关于我们板块 ----------------
@router.get("/about-sections", summary="板块列表", dependencies=[Depends(require_role("about_section", "read"))])
def list_about(db: Session = Depends(get_db)):
    rows = db.query(AboutSection).order_by(AboutSection.sort_order, AboutSection.id).all()
    items = [AboutSectionOut.model_validate(r).model_dump() for r in rows]
    return ok(data=items)


@router.get("/about-sections/{code}", summary="板块详情", dependencies=[Depends(require_role("about_section", "read"))])
def get_about(code: str, db: Session = Depends(get_db)):
    obj = db.query(AboutSection).filter(AboutSection.code == code).first()
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    return ok(data=AboutSectionOut.model_validate(obj).model_dump())


@router.put("/about-sections/{code}", summary="更新板块", dependencies=[Depends(require_role("about_section", "write"))])
def update_about(code: str, body: AboutSectionUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.query(AboutSection).filter(AboutSection.code == code).first()
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "update", "about_section", obj.id)
    db.commit()
    return ok(data=AboutSectionOut.model_validate(obj).model_dump())


# ---------------- 公司信息（单行 id=1） ----------------
@router.get("/company-info", summary="公司信息", dependencies=[Depends(require_role("company_info", "read"))])
def get_company_info(db: Session = Depends(get_db)):
    obj = db.get(CompanyInfo, 1)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    return ok(data=CompanyInfoOut.model_validate(obj).model_dump())


@router.put("/company-info", summary="更新公司信息", dependencies=[Depends(require_role("company_info", "write"))])
def update_company_info(body: CompanyInfoUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(CompanyInfo, 1)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "update", "company_info", obj.id)
    db.commit()
    return ok(data=CompanyInfoOut.model_validate(obj).model_dump())


# ---------------- 发展历程里程碑 ----------------
@router.get("/milestones", summary="里程碑列表", dependencies=[Depends(require_role("milestone", "read"))])
def list_milestones(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Milestone)
    if status:
        q = q.filter(Milestone.status == status)
    total = q.count()
    rows = q.order_by(Milestone.sort_order, Milestone.id).offset((page-1)*page_size).limit(page_size).all()
    items = [MilestoneOut.model_validate(r).model_dump() for r in rows]
    return ok(data=_page(items, total, page, page_size))


@router.post("/milestones", summary="新建里程碑", dependencies=[Depends(require_role("milestone", "write"))])
def create_milestone(body: MilestoneCreate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = Milestone(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "create", "milestone", obj.id)
    db.commit()
    return ok(data=MilestoneOut.model_validate(obj).model_dump())


@router.get("/milestones/{mid}", summary="里程碑详情", dependencies=[Depends(require_role("milestone", "read"))])
def get_milestone(mid: int, db: Session = Depends(get_db)):
    obj = db.get(Milestone, mid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    return ok(data=MilestoneOut.model_validate(obj).model_dump())


@router.put("/milestones/{mid}", summary="更新里程碑", dependencies=[Depends(require_role("milestone", "write"))])
def update_milestone(mid: int, body: MilestoneUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Milestone, mid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "update", "milestone", obj.id)
    db.commit()
    return ok(data=MilestoneOut.model_validate(obj).model_dump())


@router.delete("/milestones/{mid}", summary="删除里程碑（软删）", dependencies=[Depends(require_role("milestone", "write"))])
def delete_milestone(mid: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Milestone, mid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    obj.status = "hidden"
    db.add(obj)
    log_action(db, admin.id, "delete", "milestone", obj.id)
    db.commit()
    return ok(message="已删除")


# ---------------- 上传 ----------------
@router.post("/upload", summary="图片/文件上传（返回可访问 URL）", dependencies=AUTH)
async def upload(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in settings.ALLOWED_IMAGE_EXT:
        raise HTTPException(status_code=400, detail="不支持的文件类型")
    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail="文件过大")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    fname = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(settings.UPLOAD_DIR, fname), "wb") as f:
        f.write(content)
    return ok(data={"url": f"/static/uploads/{fname}", "filename": fname})


# ---------------- 管理员 ----------------
@router.get("/admins", summary="管理员列表", dependencies=[Depends(require_role("admin_user", "read"))])
def list_admins(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    q = db.query(AdminUser)
    total = q.count()
    rows = q.order_by(AdminUser.id).offset((page-1)*page_size).limit(page_size).all()
    items = [_admin_out(r).model_dump() for r in rows]
    return ok(data=_page(items, total, page, page_size))


@router.post("/admins", summary="新建管理员", dependencies=[Depends(require_role("admin_user", "write"))])
def create_admin(body: AdminUserCreate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    from app.core.security import hash_password
    if db.query(AdminUser).filter(AdminUser.username == body.username).first():
        raise HTTPException(status_code=409, detail="用户名已存在")
    role = db.get(Role, body.role_id)
    if role is None:
        raise HTTPException(status_code=400, detail="角色不存在")
    obj = AdminUser(
        username=body.username,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
        role_id=body.role_id,
        status=body.status,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "create", "admin_user", obj.id)
    db.commit()
    return ok(data=_admin_out(obj).model_dump())


@router.get("/admins/{aid}", summary="管理员详情", dependencies=[Depends(require_role("admin_user", "read"))])
def get_admin(aid: int, db: Session = Depends(get_db)):
    obj = db.get(AdminUser, aid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    return ok(data=_admin_out(obj).model_dump())


@router.put("/admins/{aid}", summary="更新管理员", dependencies=[Depends(require_role("admin_user", "write"))])
def update_admin(aid: int, body: AdminUserUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(AdminUser, aid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    data = body.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        from app.core.security import hash_password
        obj.password_hash = hash_password(data["password"])
    for k, v in data.items():
        if k == "password":
            continue
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "update", "admin_user", obj.id)
    db.commit()
    return ok(data=_admin_out(obj).model_dump())


@router.delete("/admins/{aid}", summary="删除管理员（软禁）", dependencies=[Depends(require_role("admin_user", "write"))])
def delete_admin(aid: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(AdminUser, aid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    if obj.id == admin.id:
        raise HTTPException(status_code=400, detail="不能禁用自己")
    obj.status = "disabled"
    db.add(obj)
    log_action(db, admin.id, "delete", "admin_user", obj.id)
    db.commit()
    return ok(message="已禁用")


# ---------------- 角色 ----------------
@router.get("/roles", summary="角色列表", dependencies=[Depends(require_role("role", "read"))])
def list_roles(db: Session = Depends(get_db)):
    rows = db.query(Role).order_by(Role.id).all()
    items = [RoleOut.model_validate(r).model_dump() for r in rows]
    return ok(data=items)


@router.post("/roles", summary="新建角色", dependencies=[Depends(require_role("role", "write"))])
def create_role(body: RoleCreate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    if db.query(Role).filter(Role.name == body.name).first():
        raise HTTPException(status_code=409, detail="角色名已存在")
    obj = Role(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "create", "role", obj.id)
    db.commit()
    return ok(data=RoleOut.model_validate(obj).model_dump())


@router.get("/roles/{rid}", summary="角色详情", dependencies=[Depends(require_role("role", "read"))])
def get_role(rid: int, db: Session = Depends(get_db)):
    obj = db.get(Role, rid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    return ok(data=RoleOut.model_validate(obj).model_dump())


@router.put("/roles/{rid}", summary="更新角色", dependencies=[Depends(require_role("role", "write"))])
def update_role(rid: int, body: RoleUpdate, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Role, rid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    data = body.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        if db.query(Role).filter(Role.name == data["name"], Role.id != rid).first():
            raise HTTPException(status_code=409, detail="角色名已存在")
    for k, v in data.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    log_action(db, admin.id, "update", "role", obj.id)
    db.commit()
    return ok(data=RoleOut.model_validate(obj).model_dump())


@router.delete("/roles/{rid}", summary="删除角色（物理删除，FK RESTRICT）", dependencies=[Depends(require_role("role", "write"))])
def delete_role(rid: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    obj = db.get(Role, rid)
    if obj is None:
        raise HTTPException(status_code=404, detail="资源不存在")
    if db.query(AdminUser).filter(AdminUser.role_id == rid).first():
        raise HTTPException(status_code=409, detail="该角色下仍有管理员，无法删除")
    db.delete(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="该角色被引用，无法删除")
    log_action(db, admin.id, "delete", "role", obj.id)
    db.commit()
    return ok(message="已删除")


# ---------------- 数据统计概览（P1） ----------------
@router.get("/stats/overview", summary="控制台数据统计概览", dependencies=AUTH)
def stats_overview(db: Session = Depends(get_db)):
    def cnt(model, **filters):
        q = db.query(model)
        for k, v in filters.items():
            q = q.filter(getattr(model, k) == v)
        return q.count()

    return ok(data={
        "products": {"total": cnt(Product), "active": cnt(Product, status="active")},
        "cases": {"total": cnt(Cases), "active": cnt(Cases, status="active")},
        "news": {"total": cnt(News), "published": cnt(News, status="published"), "draft": cnt(News, status="draft")},
        "jobs": {"total": cnt(Job), "active": cnt(Job, status="active")},
        "messages": {"total": cnt(Message), "new": cnt(Message, status="new"), "handled": cnt(Message, status="handled")},
        "banners": {"total": cnt(Banner), "active": cnt(Banner, status="active")},
        "admins": cnt(AdminUser),
        "series": cnt(ProductSeries),
        "categories": cnt(Category),
        "milestones": cnt(Milestone),
    })
