import { computed } from "vue";

import { pinia } from "@/stores";
import { useHomeStore } from "@/stores/home";
import { useUserStore } from "@/stores/user";
import type { HomeDashboard } from "@/types/home";
import { request } from "@/utils/request";

function redirectToLogin() {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  if (currentPage?.route !== "pages/login/index") {
    uni.reLaunch({ url: "/pages/login/index" });
  }
}

export function useHome() {
  const homeStore = useHomeStore(pinia);
  const userStore = useUserStore(pinia);

  homeStore.loadSnapshot();

  const dashboard = computed(() => homeStore.effectiveDashboard);
  const loading = computed(() => homeStore.loading);
  const usingSnapshot = computed(() => homeStore.usingSnapshot);
  const errorMessage = computed(() => homeStore.errorMessage);
  const reviewAction = computed(
    () =>
      dashboard.value.primaryActions.find((action) => action.key === "startReview") ??
      null,
  );
  const guidanceAction = computed(
    () =>
      dashboard.value.primaryActions.find(
        (action) => action.key === dashboard.value.guidance.suggestedActionKey,
      ) ?? null,
  );
  const primaryActionSubtitle = computed(() => {
    const { reviewStatus } = dashboard.value;

    if (reviewStatus.statusKind === "OVERDUE") {
      return `${reviewStatus.pendingCount} 个知识点待复习，${reviewStatus.overdueCount} 个已逾期，建议优先处理。`;
    }

    if (reviewStatus.statusKind === "PENDING") {
      return `${reviewStatus.pendingCount} 个知识点等待完成费曼输出。`;
    }

    if (reviewStatus.statusKind === "EMPTY") {
      return "当前暂无待复习任务，先去新建知识点，继续积累输入。";
    }

    return "首页状态同步中，关键入口仍然可用。";
  });

  async function fetchDashboard(options: { silent?: boolean } = {}) {
    userStore.loadFromStorage();
    homeStore.loadSnapshot();

    if (!userStore.hasSession) {
      redirectToLogin();
      return null;
    }

    if (!options.silent) {
      homeStore.setLoading(true);
    }

    try {
      const response = await request<HomeDashboard>({
        url: "/home/dashboard",
      });
      homeStore.setDashboard(response.data);
      return response.data;
    } catch {
      homeStore.applyUnavailableFallback("首页状态暂不可用，已切换到可用兜底。\n");
      return null;
    } finally {
      homeStore.setLoading(false);
      homeStore.clearRefreshFlag();
      uni.stopPullDownRefresh();
    }
  }

  async function refreshOnShow() {
    if (homeStore.refreshOnNextShow || !homeStore.dashboard) {
      return fetchDashboard({ silent: Boolean(homeStore.snapshot) });
    }

    return dashboard.value;
  }

  return {
    dashboard,
    errorMessage,
    guidanceAction,
    loading,
    primaryActionSubtitle,
    refreshOnShow,
    reviewAction,
    usingSnapshot,
    fetchDashboard,
  };
}

export default useHome;