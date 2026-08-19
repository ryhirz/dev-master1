import { create } from "zustand";

// 轻量 UI 状态（M3 扩展：用户偏好、筛选条件等）
interface UIState {
  navOpen: boolean;
  setNavOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  navOpen: false,
  setNavOpen: (v) => set({ navOpen: v }),
}));
