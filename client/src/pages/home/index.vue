<script setup lang="ts">
import { computed } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";

import HomeGuidanceBanner from "@/components/home/HomeGuidanceBanner.vue";
import HomeHeroHeader from "@/components/home/HomeHeroHeader.vue";
import HomePrimaryActionCard from "@/components/home/HomePrimaryActionCard.vue";
import HomeStatusCard from "@/components/home/HomeStatusCard.vue";
import AppTabBar from "@/components/shared/navigation/AppTabBar.vue";
import KnowledgeEntryFab from "@/components/shared/navigation/KnowledgeEntryFab.vue";
import { useHome } from "@/composables/useHome";
import { useNavigation } from "@/composables/useNavigation";

const {
  dashboard,
  errorMessage,
  fetchDashboard,
  guidanceAction,
  loading,
  primaryActionSubtitle,
  refreshOnShow,
  reviewAction,
  usingSnapshot,
} = useHome();
const { openAction } = useNavigation();

const guidanceActionLabel = computed(() =>
  guidanceAction.value?.key === "createTopic" ? "去新建知识点" : "去开始复习",
);

const showStatusNote = computed(() => Boolean(usingSnapshot.value || errorMessage.value));

function handleGuidanceAction() {
  if (!guidanceAction.value) {
    return;
  }

  void openAction(guidanceAction.value, dashboard.value.guidance);
}

function handlePrimaryAction() {
  if (!reviewAction.value) {
    return;
  }

  void openAction(reviewAction.value);
}

onShow(() => {
  void refreshOnShow();
});

onPullDownRefresh(() => {
  void fetchDashboard();
});
</script>

<template>
  <view class="min-h-screen bg-page-bg pb-[190rpx]">
    <HomeHeroHeader
      :last-updated-at="dashboard.reviewStatus.lastUpdatedAt"
      :using-snapshot="usingSnapshot"
    >
      <HomeStatusCard
        :review-status="dashboard.reviewStatus"
        :using-snapshot="usingSnapshot"
      />
    </HomeHeroHeader>

    <view class="-mt-[22rpx] rounded-t-[42rpx] bg-page-bg px-[24rpx] pb-[40rpx] pt-[18rpx]">
      <HomeGuidanceBanner
        :guidance="dashboard.guidance"
        :action-label="guidanceActionLabel"
        @action="handleGuidanceAction"
      />

      <HomePrimaryActionCard
        class="mt-[24rpx]"
        :action="reviewAction"
        :subtitle="primaryActionSubtitle"
        :recommended="dashboard.guidance.suggestedActionKey === 'startReview'"
        @action="handlePrimaryAction"
      />

      <view
        v-if="showStatusNote"
        class="mt-[18rpx] rounded-[24rpx] bg-[rgba(255,255,255,0.72)] px-[24rpx] py-[18rpx] text-[22rpx] leading-[1.7] text-text-secondary"
      >
        {{ usingSnapshot ? "当前展示最近一次成功快照，返回首页时会继续尝试刷新最新状态。" : errorMessage }}
      </view>

      <view
        class="mt-[18rpx] flex items-center justify-between rounded-[24rpx] bg-[rgba(255,255,255,0.68)] px-[22rpx] py-[18rpx] text-[22rpx] text-text-secondary"
      >
        <text>{{ loading ? "首页状态同步中" : "关键入口已准备就绪" }}</text>
        <text class="font-[600] text-brand-primary">{{ dashboard.generatedAt.slice(11, 16) }}</text>
      </view>
    </view>

    <KnowledgeEntryFab />
    <AppTabBar active="home" />
  </view>
</template>