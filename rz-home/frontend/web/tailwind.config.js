/** @type {import('tailwindcss').Config} */
// M6 设计令牌（M6 科技感配色：深空蓝黑底 + 荧光蓝 #00B3FF / 薄荷绿 #00E5CC）
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#070B16",
        ink: "#E8F6FF",
        walnut: "#00B3FF",
        "walnut-d": "#00E5CC",
        sand: "#7FB4E0",
        muted: "#9FB3C8",
        line: "#1E3A5F",
        success: "#00E5A8",
        warning: "#FFC24B",
        danger: "#FF5C7A",
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
        sm: "0 1px 2px rgba(0,179,255,.08)",
        md: "0 4px 16px rgba(0,179,255,.14)",
        lg: "0 12px 32px rgba(0,179,255,.18)",
        glow: "0 0 24px rgba(0,179,255,.45)",
      },
      maxWidth: {
        "7xl": "1280px",
      },
    },
  },
  plugins: [],
};
