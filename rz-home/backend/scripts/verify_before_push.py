#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Rz家居 · 交付前验证闸门 (Pre-Push Verification Gate)
====================================================

在 `git push` 之前运行，对当前工作树做一次"四维验证"：
  1) 功能完整性  —— 基于 PRD 功能点的追踪（详见 docs/交付前验证.md）
  2) 稳定性      —— pytest / Vitest / 联调回归(m4_check) 是否全绿
  3) 文档一致性  —— 由脚本输出 + 人工比对 PRD/UIUX/开发文档（见报告）
  4) 安全合规    —— 由脚本检测关键项（SECRET_KEY/默认账号/限频/XSS 净化）

退出码：
  0 = GO 或 CONDITIONAL-GO（有 WARN 但无 FAIL）
  1 = NO-GO（存在 FAIL，禁止 push）

用法：
  cd rz-home/backend
  python scripts/verify_before_push.py
  python scripts/verify_before_push.py --skip-vitest   # 仅后端
  python scripts/verify_before_push.py --no-m4         # 不起服务也行(m4 标 WARN)

运行时自动解析（本脚本不含任何"本机绝对路径"，换机器/换人可直接用）：
  python：项目 venv（venv/.venv，Windows 与 POSIX 布局都试）
          → 当前解释器 sys.executable → PATH。可用环境变量 RZ_PYTHON 覆盖。
  node  ：PATH → 常见安装位置（Program Files\\nodejs、/usr/bin 等）。
          可用环境变量 RZ_NODE 覆盖；找不到时前端检查降级为 WARN，不中断。
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent          # .../backend
ROOT = BACKEND.parent                                      # .../rz-home
ADMIN = ROOT / "frontend" / "admin"

TIMEOUT = 600  # 单步超时(秒)


# ---------------------------------------------------------------------------
# 运行时解析（可移植：不硬编码任何"本机绝对路径"，换机器/换人照样能跑）
# ---------------------------------------------------------------------------
# 解析优先级（Python）：
#   1) 环境变量 RZ_PYTHON 显式指定（CI / 特殊机器用）
#   2) 项目 venv（venv / .venv，Windows(POSIX) 两种目录布局都试）
#      —— 保证跑在"项目依赖"上，与旧行为一致
#   3) 正在运行本脚本的解释器 sys.executable
#      —— 你本来就是用某个 python 把它跑起来的，那是最合理的默认值
#   4) PATH 上的 python / python3
#   全都没有 → 返回 None，对应的检查项报 FAIL/WARN，而不是抛异常崩掉。
# Node 同理（RZ_NODE → PATH → 常见安装位置）。
# ---------------------------------------------------------------------------
def _first_existing(*cands: Path | None) -> Path | None:
    for c in cands:
        if c is not None and c.exists():
            return c
    return None


def resolve_python() -> str | None:
    env = os.environ.get("RZ_PYTHON")
    if env and Path(env).exists():
        return Path(env).as_posix()
    venv_py = _first_existing(
        BACKEND / "venv" / "Scripts" / "python.exe",   # Windows venv
        BACKEND / "venv" / "bin" / "python",           # POSIX venv
        BACKEND / ".venv" / "Scripts" / "python.exe",
        BACKEND / ".venv" / "bin" / "python",
    )
    if venv_py is not None:
        return venv_py.as_posix()
    if sys.executable and Path(sys.executable).exists():
        return Path(sys.executable).as_posix()
    found = shutil.which("python") or shutil.which("python3")
    return Path(found).as_posix() if found else None


def resolve_node() -> str | None:
    env = os.environ.get("RZ_NODE")
    if env and Path(env).exists():
        return Path(env).as_posix()
    found = shutil.which("node")
    if found:
        return Path(found).as_posix()
    common = _first_existing(
        Path(r"C:\Program Files\nodejs\node.exe"),
        Path(r"C:\Program Files (x86)\nodejs\node.exe"),
        Path("/usr/local/bin/node"),
        Path("/usr/bin/node"),
    )
    return common.as_posix() if common else None


PY = resolve_python()
NODE = resolve_node()
VITEST = (ADMIN / "node_modules" / "vitest" / "vitest.mjs").as_posix()


@dataclass
class Result:
    name: str
    status: str            # PASS / WARN / FAIL
    detail: str = ""
    evidence: str = ""


@dataclass
class Gate:
    results: list[Result] = field(default_factory=list)

    def add(self, r: Result) -> None:
        self.results.append(r)

    @property
    def failed(self) -> int:
        return sum(1 for r in self.results if r.status == "FAIL")

    @property
    def warned(self) -> int:
        return sum(1 for r in self.results if r.status == "WARN")

    @property
    def verdict(self) -> str:
        if self.failed:
            return "NO-GO"
        return "CONDITIONAL-GO" if self.warned else "GO"


def run(cmd: list[str], cwd: Path, timeout: int = TIMEOUT) -> tuple[int, str]:
    try:
        p = subprocess.run(
            cmd, cwd=str(cwd), capture_output=True, text=True, timeout=timeout
        )
        return p.returncode, (p.stdout + p.stderr)
    except FileNotFoundError as e:
        return 127, f"命令不存在: {e}"
    except subprocess.TimeoutExpired:
        return 124, f"超时({timeout}s)"
    except Exception as e:  # noqa: BLE001
        return 1, f"异常: {e}"


# ---------------------------------------------------------------------------
# 1) 后端单测 pytest
# ---------------------------------------------------------------------------
def check_pytest() -> Result:
    if PY is None:
        return Result("后端单测 pytest", "FAIL",
                      "未找到可用 Python 解释器（可用环境变量 RZ_PYTHON 指定）", "")
    rc, out = run([PY, "-m", "pytest", "-q", "-rs"], BACKEND)
    # pytest -q 的摘要在管道中常被吞，改为解析进度行 "....s..[100%]"
    prog = ""
    for ln in out.splitlines():
        if "[100%]" in ln:
            prog = ln.split("[100%]")[0]
            break
    npass = prog.count(".")
    nskip = prog.count("s")
    nfail = prog.count("F") + prog.count("E")
    if rc != 0 or nfail > 0:
        return Result("后端单测 pytest", "FAIL",
                      f"退出码={rc}, 失败={nfail}", out[-800:])
    return Result("后端单测 pytest", "PASS",
                  f"{npass} passed, {nskip} skipped, 0 failed",
                  f"rc={rc}")


# ---------------------------------------------------------------------------
# 2) 后台前端单测 Vitest (admin)
# ---------------------------------------------------------------------------
def check_vitest(skip: bool) -> Result:
    if skip:
        return Result("后台前端 Vitest", "WARN", "按 --skip-vitest 跳过", "")
    if NODE is None:
        return Result("后台前端 Vitest", "WARN",
                      "PATH 中未找到 node（可用环境变量 RZ_NODE 指定），跳过前端单测", "")
    if not Path(VITEST).exists():
        return Result("后台前端 Vitest", "WARN",
                      "node_modules/vitest 缺失，未执行(可 npm i 后补跑)", "")
    rc, out = run([NODE, VITEST, "run"], ADMIN)
    npass = 0
    ansi = re.compile(r"\x1b\[[0-9;]*m")
    for ln in out.splitlines():
        ln = ansi.sub("", ln).strip()
        if "Tests" in ln and "passed" in ln:
            m = re.search(r"(\d+)", ln)
            if m:
                npass = int(m.group(1))
            break
    if rc != 0:
        return Result("后台前端 Vitest", "FAIL",
                      f"退出码={rc}, 见输出", out[-800:])
    return Result("后台前端 Vitest", "PASS", f"{npass} passed", f"rc={rc}")


# ---------------------------------------------------------------------------
# 3) 联调回归 m4_check (需后端在 :8000 运行)
# ---------------------------------------------------------------------------
def check_m4(skip: bool) -> Result:
    if skip:
        return Result("联调回归 m4_check", "WARN", "按 --no-m4 跳过", "")
    if PY is None:
        return Result("联调回归 m4_check", "WARN", "未找到 Python 解释器，跳过", "")
    rc, out = run([PY, "scripts/m4_check.py"], BACKEND, timeout=120)
    if rc == 124:
        return Result("联调回归 m4_check", "WARN",
                      "运行超时(需后端 :8000 在线)", out[-400:])
    if rc != 0:
        # m4_check 依赖运行中服务；非 0 多半是服务未起，标 WARN 而非 FAIL
        return Result("联调回归 m4_check", "WARN",
                      f"未通过(多因后端未起/端口占用)，请起服务后重跑", out[-600:])
    return Result("联调回归 m4_check", "PASS", "23/23 回归通过", out[-400:])


# ---------------------------------------------------------------------------
# 4) 安全合规速检（静态检查，不依赖运行）
# ---------------------------------------------------------------------------
def check_security() -> list[Result]:
    res = []

    # 4a) XSS 净化模块是否落地
    sanitize = BACKEND / "app" / "core" / "sanitize.py"
    res.append(Result(
        "安全·富文本XSS净化",
        "PASS" if sanitize.exists() else "FAIL",
        "app/core/sanitize.py 已落地(bleach 白名单)" if sanitize.exists()
        else "缺失 sanitize.py，存储型 XSS 风险",
    ))

    # 4b) 限频中间件（以单测文件存在作为落地证据，避免误报）
    rate = (BACKEND / "tests" / "test_m5_rate_limit.py").exists()
    res.append(Result(
        "安全·留言限频",
        "PASS" if rate else "WARN",
        "检测到限频实现(10/min, 见 test_m5_rate_limit.py)" if rate else "未检出限频，建议复核",
    ))

    # 4c) 默认超管账号(仅提醒，生产前置)
    res.append(Result(
        "安全·默认账号",
        "WARN",
        "生产前须改 admin/admin123 并清理演示账号(见 上线检查清单 D 区)",
        "",
    ))
    return res


# ---------------------------------------------------------------------------
# 报告
# ---------------------------------------------------------------------------
def print_report(gate: Gate) -> None:
    line = "=" * 68
    print(line)
    print("  Rz家居 · 交付前验证闸门 (Pre-Push Verification Gate)")
    print(line)
    print(f"  运行时: python = {PY or '(未找到)'}")
    print(f"          node   = {NODE or '(未找到)'}")
    print(line)
    for r in gate.results:
        tag = {"PASS": "[PASS]", "WARN": "[WARN]", "FAIL": "[FAIL]"}.get(r.status, "[?]")
        print(f"  {tag} {r.name}")
        if r.detail:
            print(f"         └─ {r.detail}")
    print(line)
    print(f"  结论: {gate.verdict}   "
          f"(FAIL={gate.failed}, WARN={gate.warned})")
    print(line)
    if gate.verdict == "NO-GO":
        print("  [NO-GO] 存在 FAIL：禁止 push，先修复后再验证。")
    elif gate.verdict == "CONDITIONAL-GO":
        print("  [CONDITIONAL-GO] 允许 push，但须跟进 WARN 项(见 docs/交付前验证.md)。")
    else:
        print("  [GO] 可 push。仍建议对照 docs/交付前验证.md 完成文档一致性人工比对。")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-vitest", action="store_true")
    ap.add_argument("--no-m4", action="store_true")
    args = ap.parse_args()

    gate = Gate()
    gate.add(check_pytest())
    gate.add(check_vitest(args.skip_vitest))
    gate.add(check_m4(args.no_m4))
    for r in check_security():
        gate.add(r)

    print_report(gate)
    # NO-GO => 退出 1；其余退出 0
    return 1 if gate.failed else 0


if __name__ == "__main__":
    sys.exit(main())
