"""公开接口（17 项）— 严格只读 active/published 数据。

契约来源：《开发技术文档》§5；路径前缀 /api。
不可见资源（hidden/draft）返回 404 → 由异常处理器映射为 code 3001。
"""
import time
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.response import ok
from app.models.catalog import ProductSeries, Category, Product
from app.models.content import Cases, News, Banner, AboutSection, Milestone, CompanyInfo
from app.models.crm import Job, Message
from app.schemas.catalog import ProductSeriesOut, CategoryOut, ProductOut
from app.schemas.content import (
    CaseOut, NewsOut, BannerOut, AboutSectionOut, MilestoneOut, CompanyInfoOut,
)
from app.schemas.crm import JobOut, InquiryCreate, InquiryOut
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["public"])

# 留言限频（内存级，按 IP 计数；重启清零，P1 可接受）
_rate: Dict[str, List[float]] = {}


def _check_rate_limit(ip: str) -> None:
    now = time.time()
    window = _rate.get(ip, [])
    window = [t for t in window if now - t < 60]
    if len(window) >= settings.MESSAGE_RATE_LIMIT_PER_MIN:
        raise HTTPException(status_code=429, detail="留言过于频繁，请稍后再试")
    window.append(now)
    _rate[ip] = window


def _page(items: List[dict], total: int, page: int, page_size: int) -> dict:
    return {"items": items, "page": page, "page_size": page_size, "total": total}


def _hidden_404():
    raise HTTPException(status_code=404, detail="资源不可见")


@router.get("/health", summary="公开健康检查（信封）")
def health():
    return ok(data={"status": "ok"})


@router.get("/home/overview", summary="首页聚合（轮播+推荐+实力+最新）")
def home_overview(db: Session = Depends(get_db)):
    banners = db.query(Banner).filter(Banner.status == "active").order_by(Banner.sort_order).all()
    recommended = (
        db.query(Product)
        .filter(Product.status == "active", Product.is_recommended == True)  # noqa: E712
        .order_by(desc(Product.created_at)).limit(8).all()
    )
    company = db.get(CompanyInfo, 1)
    latest_cases = (
        db.query(Cases).filter(Cases.status == "active")
        .order_by(desc(Cases.is_new), desc(Cases.created_at)).limit(6).all()
    )
    latest_news = (
        db.query(News).filter(News.status == "published")
        .order_by(desc(News.is_top), desc(News.published_at), desc(News.created_at))
        .limit(5).all()
    )
    job_count = db.query(Job).filter(Job.status == "active").count()

    series_map = {s.id: s.name for s in db.query(ProductSeries).all()}
    cat_map = {c.id: c.name for c in db.query(Category).all()}
    rec = []
    for p in recommended:
        d = ProductOut.model_validate(p).model_dump()
        d["series_name"] = series_map.get(p.series_id)
        d["category_name"] = cat_map.get(p.category_id)
        rec.append(d)

    return ok(data={
        "banners": [BannerOut.model_validate(b).model_dump() for b in banners],
        "recommended_products": rec,
        "company": CompanyInfoOut.model_validate(company).model_dump() if company else None,
        "latest_cases": [CaseOut.model_validate(c).model_dump() for c in latest_cases],
        "latest_news": [NewsOut.model_validate(n).model_dump() for n in latest_news],
        "job_open_count": job_count,
    })


@router.get("/series", summary="产品系列列表")
def list_series(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(ProductSeries).filter(ProductSeries.status == "active")
    total = q.count()
    rows = q.order_by(ProductSeries.sort_order, ProductSeries.id).offset((page-1)*page_size).limit(page_size).all()
    items = [ProductSeriesOut.model_validate(r).model_dump() for r in rows]
    return ok(data=_page(items, total, page, page_size))


@router.get("/products", summary="产品列表（筛选/分页）")
def list_products(
    series_id: Optional[int] = None,
    category_id: Optional[int] = None,
    keyword: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Product).filter(Product.status == "active")
    if series_id is not None:
        q = q.filter(Product.series_id == series_id)
    if category_id is not None:
        q = q.filter(Product.category_id == category_id)
    if keyword:
        like = f"%{keyword}%"
        q = q.filter((Product.name.ilike(like)) | (Product.summary.ilike(like)))
    total = q.count()
    rows = q.order_by(desc(Product.is_recommended), desc(Product.created_at)).offset((page-1)*page_size).limit(page_size).all()
    series_map = {s.id: s.name for s in db.query(ProductSeries).all()}
    cat_map = {c.id: c.name for c in db.query(Category).all()}
    items = []
    for p in rows:
        d = ProductOut.model_validate(p).model_dump()
        d["series_name"] = series_map.get(p.series_id)
        d["category_name"] = cat_map.get(p.category_id)
        items.append(d)
    return ok(data=_page(items, total, page, page_size))


@router.get("/products/{product_id}", summary="产品详情")
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.get(Product, product_id)
    if p is None or p.status != "active":
        _hidden_404()
    series_map = {s.id: s.name for s in db.query(ProductSeries).all()}
    cat_map = {c.id: c.name for c in db.query(Category).all()}
    d = ProductOut.model_validate(p).model_dump()
    d["series_name"] = series_map.get(p.series_id)
    d["category_name"] = cat_map.get(p.category_id)
    related = (
        db.query(Product).filter(Product.status == "active", Product.series_id == p.series_id, Product.id != p.id)
        .order_by(desc(Product.created_at)).limit(4).all()
    )
    rel = [ProductOut.model_validate(r).model_dump() for r in related]
    return ok(data={"product": d, "related": rel})


@router.get("/cases", summary="案例列表（分类/is_new）")
def list_cases(
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Cases).filter(Cases.status == "active")
    if category:
        q = q.filter(Cases.category == category)
    total = q.count()
    rows = q.order_by(desc(Cases.is_new), desc(Cases.created_at)).offset((page-1)*page_size).limit(page_size).all()
    items = [CaseOut.model_validate(r).model_dump() for r in rows]
    return ok(data=_page(items, total, page, page_size))


@router.get("/cases/{case_id}", summary="案例详情")
def get_case(case_id: int, db: Session = Depends(get_db)):
    c = db.get(Cases, case_id)
    if c is None or c.status != "active":
        _hidden_404()
    return ok(data=CaseOut.model_validate(c).model_dump())


@router.get("/news", summary="新闻列表（Tab/置顶/仅published）")
def list_news(
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(News).filter(News.status == "published")
    if category:
        q = q.filter(News.category == category)
    total = q.count()
    rows = q.order_by(desc(News.is_top), desc(News.published_at), desc(News.created_at)).offset((page-1)*page_size).limit(page_size).all()
    items = [NewsOut.model_validate(r).model_dump() for r in rows]
    return ok(data=_page(items, total, page, page_size))


@router.get("/news/{news_id}", summary="新闻详情（draft→3001）")
def get_news(news_id: int, db: Session = Depends(get_db)):
    n = db.get(News, news_id)
    if n is None or n.status != "published":
        _hidden_404()
    return ok(data=NewsOut.model_validate(n).model_dump())


@router.get("/about/overview", summary="关于我们-总览")
def about_overview(db: Session = Depends(get_db)):
    company = db.get(CompanyInfo, 1)
    overview = db.query(AboutSection).filter(AboutSection.code == "overview", AboutSection.status == "active").first()
    return ok(data={
        "company": CompanyInfoOut.model_validate(company).model_dump() if company else None,
        "overview": AboutSectionOut.model_validate(overview).model_dump() if overview else None,
    })


@router.get("/about/history", summary="关于我们-发展历程")
def about_history(db: Session = Depends(get_db)):
    rows = db.query(Milestone).filter(Milestone.status == "active").order_by(Milestone.sort_order, Milestone.id).all()
    items = [MilestoneOut.model_validate(r).model_dump() for r in rows]
    return ok(data=items)


@router.get("/about/brand", summary="关于我们-品牌介绍")
def about_brand(db: Session = Depends(get_db)):
    brand = db.query(AboutSection).filter(AboutSection.code == "brand", AboutSection.status == "active").first()
    if brand is None:
        _hidden_404()
    return ok(data=AboutSectionOut.model_validate(brand).model_dump())


@router.get("/contact/info", summary="联系我们-信息")
def contact_info(db: Session = Depends(get_db)):
    company = db.get(CompanyInfo, 1)
    if company is None:
        _hidden_404()
    c = CompanyInfoOut.model_validate(company).model_dump()
    contact = {k: c.get(k) for k in ("name", "address", "phone", "email", "wechat", "icp_no")}
    return ok(data=contact)


@router.get("/jobs", summary="招聘列表（Tab social/campus）")
def list_jobs(
    type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Job).filter(Job.status == "active")
    if type:
        q = q.filter(Job.type == type)
    total = q.count()
    rows = q.order_by(desc(Job.created_at)).offset((page-1)*page_size).limit(page_size).all()
    items = [JobOut.model_validate(r).model_dump() for r in rows]
    return ok(data=_page(items, total, page, page_size))


@router.get("/jobs/{job_id}", summary="招聘详情")
def get_job(job_id: int, db: Session = Depends(get_db)):
    j = db.get(Job, job_id)
    if j is None or j.status != "active":
        _hidden_404()
    return ok(data=JobOut.model_validate(j).model_dump())


@router.get("/banners", summary="前台轮播列表（仅启用）")
def list_banners(db: Session = Depends(get_db)):
    rows = db.query(Banner).filter(Banner.status == "active").order_by(Banner.sort_order, Banner.id).all()
    items = [BannerOut.model_validate(r).model_dump() for r in rows]
    return ok(data=items)


@router.post("/inquiries", summary="提交留言/求职意向（type=contact/job_application）")
def create_inquiry(body: InquiryCreate, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    _check_rate_limit(ip)

    if body.type == "job_application" and body.job_id is None:
        raise HTTPException(status_code=400, detail="求职意向需关联职位 job_id")

    msg = Message(
        type=body.type,
        ref_id=body.job_id,
        name=body.name,
        phone=body.phone,
        email=body.email,
        content=body.content,
        status="new",
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return ok(data=InquiryOut(id=msg.id, type=msg.type).model_dump(), message="提交成功")
