"""统一响应信封与错误码（对齐《开发技术文档》§5）。

信封结构：{ code, message, data, request_id }
- 业务成功：HTTP 200，code=0。
- 业务错误：HTTP 状态与 code 对应（401→2001, 403→2003, 404→3001, 429→429, 其他→5000）。
错误码表（节选，详见 docs/API_CONTRACT.md）：
  1001 参数缺失 / 1002 参数格式错误 / 1003 校验失败
  2001 未认证 / 2002 令牌失效 / 2003 无权限 / 2004 资源不存在 / 2005 资源冲突
  3001 前台资源不可见(hidden/draft) / 3002 频率限制
  429  限频 / 5000 服务器内部错误
"""
import uuid
from typing import Any, Optional

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def make_envelope(
    code: int = 0,
    message: str = "ok",
    data: Any = None,
    request_id: Optional[str] = None,
) -> dict:
    return {
        "code": code,
        "message": message,
        "data": jsonable_encoder(data),
        "request_id": request_id or uuid.uuid4().hex,
    }


def envelope(
    code: int = 0,
    message: str = "ok",
    data: Any = None,
    status_code: int = 200,
    request_id: Optional[str] = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=make_envelope(code=code, message=message, data=data, request_id=request_id),
    )


def ok(data: Any = None, message: str = "ok") -> JSONResponse:
    return envelope(code=0, message=message, data=data)


def not_implemented() -> JSONResponse:
    """M1 接口桩占位：返回 501 + 错误码 5000。"""
    return envelope(code=5000, message="Not implemented yet (M2)", status_code=501)
