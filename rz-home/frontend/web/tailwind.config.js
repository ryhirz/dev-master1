/** @type {import('tailwindcss').Config} */
// 设计令牌严格对齐 UI/UX §2.2（cream/walnut/walnut-d/sand/ink/muted/line + 语义色 success/warning/danger）
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        ink: "#1F1B16",
        walnut: "#6B4F3A",
        "walnut-d": "#4A3728",
        sand: "#C8A97E",
        muted: "#574F45",
        line: "#E7E0D6",
        success: "#2F6B4F",
        warning: "#B5852A",
        danger: "#B4423A",
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(31,27,22,.04)",
        md: "0 4px 16px rgba(31,27,22,.08)",
        lg: "0 12px 32px rgba(31,27,22,.12)",
      },
      maxWidth: {
        "7xl": "1280px",
      },
    },
  },
  plugins: [],
};
