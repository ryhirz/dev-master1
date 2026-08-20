/** @type {import('tailwindcss').Config} */
// M6.2 设计令牌（白底蓝科技：白/白浅蓝底 + 荧光蓝 #00B3FF / 薄荷 #00E5CC 强调）
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFFFFF",
        ink: "#0E2A4A",
        walnut: "#00B3FF",
        "walnut-d": "#00E5CC",
        sand: "#F2F8FF",
        muted: "#5E7390",
        line: "#D7E9FA",
        success: "#00C19A",
        warning: "#F09A24",
        danger: "#E54856",
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
        sm: "0 1px 2px rgba(14,42,74,.04)",
        md: "0 4px 16px rgba(14,42,74,.08)",
        lg: "0 12px 32px rgba(14,42,74,.10)",
        glow: "0 0 24px rgba(0,179,255,.20)",
      },
      maxWidth: {
        "7xl": "1280px",
      },
    },
  },
  plugins: [],
};