import { describe, expect, it } from "vitest";
import { errMsg, unwrap } from "./client";

describe("unwrap（响应信封解包）", () => {
  it("code=0 时返回 data", async () => {
    const r = await unwrap<{ a: number }>(
      Promise.resolve({ data: { code: 0, message: "ok", data: { a: 1 }, request_id: "r1" } }),
    );
    expect(r).toEqual({ a: 1 });
  });

  it("code!=0 时抛业务错误（message 透出）", async () => {
    await expect(
      unwrap(Promise.resolve({ data: { code: 2001, message: "用户名或密码错误", data: null } })),
    ).rejects.toThrow("用户名或密码错误");
  });

  it("code=0 且 data 为数组时原样返回", async () => {
    const r = await unwrap<string[]>(Promise.resolve({ data: { code: 0, message: "ok", data: ["a", "b"] } }));
    expect(r).toEqual(["a", "b"]);
  });
});

describe("errMsg（统一错误提取）", () => {
  it("提取 HTTP 响应的 detail", () => {
    const e = { isAxiosError: true, response: { status: 401, data: { detail: "token 无效" } } };
    expect(errMsg(e)).toBe("token 无效");
  });

  it("提取 HTTP 响应的 message（业务信封）", () => {
    const e = { isAxiosError: true, response: { status: 400, data: { message: "参数错误" } } };
    expect(errMsg(e)).toBe("参数错误");
  });

  it("无响应体时回退状态码文案", () => {
    const e = { isAxiosError: true, response: { status: 500, data: {} } };
    expect(errMsg(e)).toContain("500");
  });

  it("普通 Error 透出 message", () => {
    expect(errMsg(new Error("boom"))).toBe("boom");
  });

  it("未知类型回退默认文案", () => {
    expect(errMsg("x", "操作失败")).toBe("操作失败");
  });
});
