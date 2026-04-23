import { computed } from "vue";

import { pinia } from "@/stores";
import { useReviewStore } from "@/stores/review";
import type { ReviewListResponse, ReviewTab } from "@/types/review";
import { request } from "@/utils/request";
import { useReviewNotifications } from "./useReviewNotifications";

function showMessage(message: string) {
  uni.showToast({
    title: message,
    icon: "none",
    duration: 2200,
  });
}

function navigateTo(url: string) {
  return new Promise<void>((resolve, reject) => {
    uni.navigateTo({
      url,
      success: () => resolve(),
      fail: (error) => reject(error),
    });
  });
}

export function useReviewList() {
  const reviewStore = useReviewStore(pinia);
  const { consumePendingTarget, rebuildNotifications, syncNotifications } =
    useReviewNotifications();

  const loading = computed(() => reviewStore.listLoading);
  const selectedTab = computed(() => reviewStore.selectedTab);
  const summary = computed(() => reviewStore.summary);
  const tasks = computed(() => reviewStore.tasks);
  const listError = computed(() => reviewStore.listError);

  async function fetchList(
    tab = reviewStore.selectedTab,
    options: { silent?: boolean } = {},
  ) {
    reviewStore.setSelectedTab(tab);

    if (!options.silent) {
      reviewStore.startListLoading();
    }

    try {
      const response = await request<ReviewListResponse>({
        url: `/reviews/tasks?tab=${tab}`,
      });
      reviewStore.setListData(response.data);
      await syncNotifications(
        response.data.tasks,
        response.data.reminderPolicy,
      );
      return response.data;
    } catch {
      reviewStore.setListError("复习列表暂不可用，请稍后重试");
      return null;
    } finally {
      reviewStore.finishListLoading();
      reviewStore.clearRefreshFlag();
      uni.stopPullDownRefresh();
    }
  }

  async function switchTab(tab: ReviewTab) {
    if (tab === reviewStore.selectedTab && reviewStore.tasks.length > 0) {
      return reviewStore.tasks;
    }

    return fetchList(tab);
  }

  async function openTask(taskId: string) {
    reviewStore.markRefreshNeeded();

    try {
      await navigateTo(`/pages/review-session/index?taskId=${taskId}`);
      return true;
    } catch {
      showMessage("复习页暂不可用，请稍后重试");
      return false;
    }
  }

  async function refreshOnShow() {
    await rebuildNotifications();

    const pendingTarget = consumePendingTarget();
    if (pendingTarget) {
      try {
        await navigateTo(pendingTarget);
      } catch {
        showMessage("目标复习任务暂不可用，请从列表重新进入");
      }
      return null;
    }

    if (reviewStore.refreshOnNextShow || reviewStore.tasks.length === 0) {
      return fetchList(reviewStore.selectedTab, {
        silent: reviewStore.tasks.length > 0,
      });
    }

    return reviewStore.tasks;
  }

  return {
    fetchList,
    listError,
    loading,
    openTask,
    refreshOnShow,
    selectedTab,
    summary,
    switchTab,
    tasks,
  };
}

export default useReviewList;
