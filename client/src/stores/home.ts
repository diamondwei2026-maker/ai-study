import { defineStore } from "pinia";

import type {
  GuidancePriority,
  HomeActionContext,
  HomeDashboard,
  PrimaryActionEntry,
} from "@/types/home";

const STORAGE_KEY = "ai-study:home-dashboard-snapshot";

function createFallbackDashboard(): HomeDashboard {
  return {
    generatedAt: new Date().toISOString(),
    reviewStatus: {
      statusKind: "UNAVAILABLE",
      pendingCount: 0,
      overdueCount: 0,
      completedToday: 0,
    },
    primaryActions: [
      {
        key: "startReview",
        label: "开始复习",
        targetModule: "review.start",
        enabled: false,
        priority: 1,
        disabledReason: "首页状态暂不可用，请稍后重试",
      },
      {
        key: "createTopic",
        label: "新建知识点",
        targetModule: "topic.create",
        enabled: true,
        priority: 2,
        disabledReason: null,
      },
    ],
    guidance: {
      type: "CHECK_PROGRESS",
      title: "首页状态暂不可用，但关键入口仍可继续使用",
      description: "你可以先新建知识点，稍后再返回首页刷新最新状态。",
      suggestedActionKey: "createTopic",
      reason: "首页聚合数据暂不可用",
    },
  };
}

export const useHomeStore = defineStore("home", {
  state: () => ({
    dashboard: null as HomeDashboard | null,
    snapshot: null as HomeDashboard | null,
    loading: false,
    hydrated: false,
    usingSnapshot: false,
    refreshOnNextShow: false,
    errorMessage: "",
    lastActionContext: null as HomeActionContext | null,
  }),
  getters: {
    effectiveDashboard: (state): HomeDashboard =>
      state.dashboard ?? state.snapshot ?? createFallbackDashboard(),
    guidancePriority: (state): GuidancePriority => {
      const guidanceType = (state.dashboard ?? state.snapshot)?.guidance.type;

      switch (guidanceType) {
        case "REVIEW_NOW":
          return 1;
        case "KEEP_MOMENTUM":
          return 2;
        case "CREATE_FIRST":
          return 3;
        default:
          return 4;
      }
    },
    reviewAction: (state): PrimaryActionEntry | null =>
      (state.dashboard ?? state.snapshot)?.primaryActions.find(
        (action) => action.key === "startReview",
      ) ?? null,
  },
  actions: {
    loadSnapshot() {
      if (this.hydrated) {
        return;
      }

      const snapshot = uni.getStorageSync(STORAGE_KEY) as {
        dashboard?: HomeDashboard;
      } | null;

      if (snapshot?.dashboard) {
        this.snapshot = snapshot.dashboard;
      }

      this.hydrated = true;
    },
    persistSnapshot(dashboard: HomeDashboard) {
      this.snapshot = dashboard;
      uni.setStorageSync(STORAGE_KEY, {
        dashboard,
        savedAt: new Date().toISOString(),
      });
    },
    setDashboard(dashboard: HomeDashboard) {
      this.dashboard = dashboard;
      this.usingSnapshot = false;
      this.errorMessage = "";
      this.persistSnapshot(dashboard);
    },
    applyUnavailableFallback(message: string) {
      this.errorMessage = message;
      if (this.snapshot) {
        this.dashboard = this.snapshot;
        this.usingSnapshot = true;
        return;
      }

      this.dashboard = createFallbackDashboard();
      this.usingSnapshot = false;
    },
    setLoading(loading: boolean) {
      this.loading = loading;
    },
    markRefreshNeeded() {
      this.refreshOnNextShow = true;
    },
    clearRefreshFlag() {
      this.refreshOnNextShow = false;
    },
    setLastActionContext(actionKey: HomeActionContext["actionKey"], targetModule: string) {
      this.lastActionContext = {
        actionKey,
        targetModule,
        occurredAt: new Date().toISOString(),
      };
    },
  },
});

export default useHomeStore;