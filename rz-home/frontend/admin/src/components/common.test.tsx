import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { StatusTag } from "./common";

describe("StatusTag（状态标签）", () => {
  it("已知状态渲染中文标签", () => {
    const { getByText } = render(<StatusTag status="active" />);
    expect(getByText("启用")).toBeTruthy();
  });

  it("草稿/已发布等状态映射", () => {
    const { getByText } = render(<StatusTag status="published" />);
    expect(getByText("已发布")).toBeTruthy();
  });

  it("未知状态原样展示", () => {
    const { getByText } = render(<StatusTag status="weird-state" />);
    expect(getByText("weird-state")).toBeTruthy();
  });
});
