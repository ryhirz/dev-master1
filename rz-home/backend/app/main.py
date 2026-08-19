"""FastAPI 入口：CORS、异常处理器、路由挂载、静态上传目录、生命周期建表+种子。

启动：uvicorn app.main:app --reload --port 8000  →  /docs 可见全部接口。
开发环境（ENV=dev）自动 init_db() + seed()；生产走 Alembic 迁移 + 部署脚本。
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.db import init_db, seed
from app.core.errors import register_exception_handlers
from app.routers import admin, public


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ENV in ("dev", "test"):
        init_db()
        seed()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.2.0",
    description="Rz家居 全栈项目后端 API（M2：14 表模型 + CRUD + 鉴权 + 种子已落地）",
    lifespan=lifespan,
)

# CORS：本地联调前端经 Vite proxy 访问，预置 dev 源；Prod 经环境变量收紧。
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(public.router)
app.include_router(admin.router)

# 静态上传目录（dev）
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/health", tags=["system"])
def health():
    """根健康检查（信封），与 /api/health 等价。"""
    from app.core.response import ok

    return ok(data={"status": "ok"})
