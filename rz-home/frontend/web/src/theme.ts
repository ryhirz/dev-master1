// 设计令牌常量（与 tailwind.config.js / index.css 对齐；M6 科技感配色）
export const COLORS = {
  cream: "#070B16",
  walnut: "#00B3FF",
  walnutD: "#00E5CC",
  sand: "#7FB4E0",
  ink: "#E8F6FF",
  muted: "#9FB3C8",
  line: "#1E3A5F",
  success: "#00E5A8",
  warning: "#FFC24B",
  danger: "#FF5C7A",
} as const;

export const BRAND = {
  name: "Rz智能家居",
  enName: "Rz SMART HOME",
  slogan: "全屋智能",
};

// 品牌渐变占位（无图时用于封面/图集背景，荧光蓝→薄荷绿科技渐变）
export const PLACEHOLDER_GRADIENT =
  "linear-gradient(135deg, #04101F 0%, #0A2A4A 45%, #00B3FF 100%)";
