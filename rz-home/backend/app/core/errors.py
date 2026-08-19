"""全局异常处理器：将 FastAPI/Starlette 异常统一为信封响应。

错误码映射见 core/response.py 顶部说明，完整表见 docs/API_CONTRACT.md。
"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from jose import JWTError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.response import make_envelope


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        code = 5000
        if exc.status_code == 401:
            code = 2001
        elif exc.status_code == 403:
            code = 2003
        elif exc.status_code == 404:
            code = 3001
        elif exc.status_code == 429:
            code = 429
        return JSONResponse(
            status_code=exc.status_code,
            content=make_envelope(code=code, message=str(exc.detail)),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=make_envelope(code=1003, message="参数校验失败", data=exc.errors()),
        )

    @app.exception_handler(JWTError)
    async def jwt_exception_handler(request: Request, exc: JWTError):
        return JSONResponse(
            status_code=401,
            content=make_envelope(code=2002, message="令牌无效或已过期"),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content=make_envelope(code=5000, message="服务器内部错误"),
        )
