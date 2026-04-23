<script setup lang="ts">
import { ref } from "vue";
import { onLoad, onPullDownRefresh, onShow } from "@dcloudio/uni-app";

import ReviewEmptyState from "@/components/review/ReviewEmptyState.vue";
import ReviewListHeader from "@/components/review/ReviewListHeader.vue";
import ReviewRiskBanner from "@/components/review/ReviewRiskBanner.vue";
import ReviewTabs from "@/components/review/ReviewTabs.vue";
import ReviewTaskCard from "@/components/review/ReviewTaskCard.vue";
import AppTabBar from "@/components/shared/navigation/AppTabBar.vue";
import KnowledgeEntryFab from "@/components/shared/navigation/KnowledgeEntryFab.vue";
import { useReviewList } from "@/composables/useReviewList";
import { pinia } from "@/stores";
import { useReviewStore } from "@/stores/review";
import type { ReviewTab } from "@/types/review";

const reviewStore = useReviewStore(pinia);
const {
  fetchList,
  listError,
  loading,
  openTask,
  refreshOnShow,
  selectedTab,
  summary,
  switchTab,
  tasks,
} = useReviewList();

const alertSnapshot = ref(0);

function resolveTab(value: string | string[] | undefined): ReviewTab | null {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (
    normalizedValue === "pending" ||
    normalizedValue === "overdue" ||
    normalizedValue === "all"
  ) {
    return normalizedValue;
  }

  return null;
}

function maybeShowRiskAlert() {
  if (
    !summary.value.showOverdueAlert ||
    summary.value.overdueCount === alertSnapshot.value
  ) {
    return;
  }

  alertSnapshot.value = summary.value.overdueCount;
  uni.showModal({
    title: "过期任务积压",
    content: `当前共有 ${summary.value.overdueCount} 个过期任务，请优先处理长期过期和置顶提醒项。`,
    confirmText: "我知道了",
    showCancel: false,
  });
}

async function syncPage() {
  await refreshOnShow();
  maybeShowRiskAlert();
}

async function handleTabChange(tab: ReviewTab) {
  await switchTab(tab);
  maybeShowRiskAlert();
}

onLoad((options) => {
  const initialTab = resolveTab(options?.tab);
  if (initialTab) {
    reviewStore.setSelectedTab(initialTab);
  }
});

onShow(() => {
  void syncPage();
});

onPullDownRefresh(() => {
  void fetchList(selectedTab.value);
});
</script>

<template>
  <view class="min-h-screen bg-page-bg px-[24rpx] pb-[186rpx] pt-safe">
    <ReviewListHeader :summary="summary" />

    <ReviewRiskBanner
      v-if="summary.showOverdueAlert"
      :overdue-count="summary.overdueCount"
      :pinned-count="summary.pinnedKnowledgePointIds.length"
    />

    <ReviewTabs
      :model-value="selectedTab"
      :summary="summary"
      @update:model-value="handleTabChange"
    />

    <view
      v-if="listError"
      class="review-card mt-[24rpx] px-[24rpx] py-[24rpx] text-[24rpx] leading-[1.7] text-review-long"
    >
      {{ listError }}
    </view>

    <view
      v-else-if="loading && tasks.length === 0"
      class="review-card mt-[24rpx] px-[24rpx] py-[28rpx] text-[24rpx] text-text-secondary"
    >
      正在同步复习列表...
    </view>

    <view v-else-if="tasks.length" class="mt-[24rpx] flex flex-col gap-[18rpx]">
      <ReviewTaskCard
        v-for="task in tasks"
        :key="task.taskId"
        :task="task"
        @select="openTask"
      />
    </view>

    <ReviewEmptyState v-else :tab="selectedTab" />

    <KnowledgeEntryFab />
    <AppTabBar active="review" />
  </view>
</template>
