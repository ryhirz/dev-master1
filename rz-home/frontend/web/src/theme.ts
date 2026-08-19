// 设计令牌常量（与 tailwind.config.js / index.css 对齐，UI/UX §2.2）
export const COLORS = {
  cream: "#FAF7F2",
  walnut: "#6B4F3A",
  walnutD: "#4A3728",
  sand: "#C8A97E",
  ink: "#1F1B16",
  muted: "#574F45",
  line: "#E7E0D6",
  success: "#2F6B4F",
  warning: "#B5852A",
  danger: "#B4423A",
} as const;

export const BRAND = {
  name: "Rz家居",
  enName: "Rz HOME",
  slogan: "家居美学",
};

// 品牌渐变占位（无图时用于封面/图集背景，温润胡桃木调）
export const PLACEHOLDER_GRADIENT =
  "linear-gradient(135deg, #4A3728 0%, #6B4F3A 60%, #C8A97E 100%)";
