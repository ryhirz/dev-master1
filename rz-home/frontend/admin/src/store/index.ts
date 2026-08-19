import { create } from "zustand";
import type { AdminRole } from "../theme";

// 后台会话状态（M2/M4 扩展：从 /api/admin/me 填充 role/permissions）
interface AdminState {
  role: AdminRole;
  setRole: (r: AdminRole) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  // M1 默认 super_admin（显示全部菜单）；M2 登录后由 /me 覆盖
  role: "super_admin",
  setRole: (r) => set({ role: r }),
  logout: () => {
    localStorage.removeItem("rz_access_token");
    localStorage.removeItem("rz_refresh_token");
    set({ role: "super_admin" });
  },
}));
