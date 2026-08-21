"""HTML 富文本净化（入库前统一调用，防存储型 XSS）。

前台富文本（产品描述 / 案例 / 新闻 / 关于板块等）经 `dangerouslySetInnerHTML`
渲染，因此必须在服务端用白名单净化后再落库——仅信任显式允许的标签与属性，
过滤 `<script>`、`onerror=`、事件处理器及 `javascript:` 等危险内容。

依赖：bleach（requirements.txt 已包含）。
"""
from typing import Optional

import bleach

# 允许的标签：覆盖 Tiptap StarterKit 产出 + 图片 + 基础排版
_ALLOWED_TAGS = {
    "p", "br", "strong", "b", "em", "i", "u", "s", "strike", "span", "div",
    "h1", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "img",
    "figure", "figcaption", "hr", "table", "thead", "tbody", "tr", "td", "th",
    "code", "pre",
}

# 允许的属性：链接/图片仅保留安全属性；class 用于排版但不含脚本语义
_ALLOWED_ATTRS = {
    "*": ["class"],
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "title", "width", "height"],
}

# 允许的 URL 协议：禁用 javascript:/data: 等
_ALLOWED_PROTOCOLS = {"http", "https", "mailto"}


def sanitize_html(value: Optional[str]) -> Optional[str]:
    """净化富文本 HTML；None 原样返回。

    strip=True：丢弃不在白名单中的标签（但保留其内部文本），而非转义。
    """
    if value is None:
        return None
    return bleach.clean(
        value,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRS,
        protocols=_ALLOWED_PROTOCOLS,
        strip=True,
    )
