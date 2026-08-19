"""审计日志辅助：关键写操作与登录落库（P1 审计要求，见《开发技术文档》§9）。"""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.system import AuditLog


def log_action(
    db: Session,
    admin_id: Optional[int],
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    detail: Optional[str] = None,
) -> None:
    """写入一条审计记录（不提交，由调用方统一 commit）。"""
    db.add(AuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        detail=detail,
    ))
