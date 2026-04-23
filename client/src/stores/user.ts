import { defineStore } from "pinia";

const STORAGE_KEY = "ai-study:user-session";

export interface UserInfo {
  id: string;
  phone: string;
  rawPhone?: string | null;
  nickname: string;
  avatar: string | null;
  createdAt?: string;
}

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    nickname: string;
    avatar: string | null;
  };
}

export const useUserStore = defineStore("user", {
  state: () => ({
    accessToken: "",
    refreshToken: "",
    userInfo: null as UserInfo | null,
    hydrated: false,
  }),
  getters: {
    hasSession: (state) => Boolean(state.accessToken && state.refreshToken),
  },
  actions: {
    loadFromStorage() {
      if (this.hydrated) {
        return;
      }

      const snapshot = uni.getStorageSync(STORAGE_KEY) as {
        accessToken?: string;
        refreshToken?: string;
        userInfo?: UserInfo | null;
      } | null;

      if (snapshot) {
        this.accessToken = snapshot.accessToken ?? "";
        this.refreshToken = snapshot.refreshToken ?? "";
        this.userInfo = snapshot.userInfo ?? null;
      }

      this.hydrated = true;
    },
    persist() {
      uni.setStorageSync(STORAGE_KEY, {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        userInfo: this.userInfo,
      });
    },
    setAuth(payload: AuthPayload, rawPhone?: string) {
      this.accessToken = payload.accessToken;
      this.refreshToken = payload.refreshToken;
      this.userInfo = {
        ...payload.user,
        rawPhone: rawPhone ?? this.userInfo?.rawPhone ?? null,
      };
      this.persist();
    },
    updateAccessToken(accessToken: string) {
      this.accessToken = accessToken;
      this.persist();
    },
    patchUserInfo(partial: Partial<UserInfo>) {
      this.userInfo = {
        ...(this.userInfo ?? {
          id: "",
          phone: "",
          nickname: "",
          avatar: null,
          rawPhone: null,
        }),
        ...partial,
        rawPhone: partial.rawPhone ?? this.userInfo?.rawPhone ?? null,
      };
      this.persist();
    },
    clearAuth() {
      this.accessToken = "";
      this.refreshToken = "";
      this.userInfo = null;
      uni.removeStorageSync(STORAGE_KEY);
    },
  },
});

export default useUserStore;
