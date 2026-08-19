import { create } from "zustand";
import { authApi } from "../api";
import { tokenStorage } from "../api/client";
import type { AdminMe } from "../types";

// 后台会话状态：token（localStorage）+ 当前管理员（/me 填充 role/permissions）
interface AdminState {
  me: AdminMe | null;
  loaded: boolean; // 是否已完成 /me 拉取（用于路由守卫）
  login: (username: string, password: string) => Promise<AdminMe>;
  fetchMe: () => Promise<AdminMe | null>;
  logout: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  me: null,
  loaded: false,

  login: async (username, password) => {
    const data = await authApi.login({ username, password });
    tokenStorage.set({ access_token: data.access_token, refresh_token: data.refresh_token });
    const me: AdminMe = {
      id: data.admin.id,
      username: data.admin.username,
      display_name: data.admin.display_name,
      role_name: data.admin.role_name,
      role_permissions: {},
      status: data.admin.status,
    };
    // 登录后拉取完整权限矩阵（role_permissions 来自 /me）
    try {
      const full = await authApi.me();
      set({ me: full, loaded: true });
      return full;
    } catch {
      set({ me, loaded: true });
      return me;
    }
  },

  fetchMe: async () => {
    if (!tokenStorage.access) {
      set({ me: null, loaded: true });
      return null;
    }
    try {
      const me = await authApi.me();
      set({ me, loaded: true });
      return me;
    } catch {
      tokenStorage.clear();
      set({ me: null, loaded: true });
      return null;
    }
  },

  logout: async () => {
    const rt = tokenStorage.refresh;
    try {
      if (rt) await authApi.logout(rt);
    } catch {
      /* 忽略登出接口错误，本地照常清理 */
    }
    tokenStorage.clear();
    set({ me: null, loaded: true });
  },
}));
