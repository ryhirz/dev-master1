// 设计令牌常量（与 tailwind.config.js / index.css 对齐；M6.2 白底蓝科技）
export const COLORS = {
  cream: "#FFFFFF",
  walnut: "#00B3FF",
  walnutD: "#00E5CC",
  sand: "#F2F8FF",
  ink: "#0E2A4A",
  muted: "#5E7390",
  line: "#D7E9FA",
  success: "#00C19A",
  warning: "#F09A24",
  danger: "#E54856",
} as const;

export const BRAND = {
  name: "Rz智能家居",
  enName: "Rz SMART HOME",
  slogan: "全屋智能",
};

// 无图占位渐变（白底科技风：白→浅蓝→荧光蓝）
export const PLACEHOLDER_GRADIENT =
  "linear-gradient(135deg, #F8FBFF 0%, #E1F4FF 50%, #BFE0FB 100%)";
