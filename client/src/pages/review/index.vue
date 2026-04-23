<script setup lang="ts">
import { onHide } from "@dcloudio/uni-app";

import AppTabBar from "@/components/shared/navigation/AppTabBar.vue";
import KnowledgeEntryFab from "@/components/shared/navigation/KnowledgeEntryFab.vue";
import { pinia } from "@/stores";
import { useHomeStore } from "@/stores/home";

const homeStore = useHomeStore(pinia);

onHide(() => {
  homeStore.markRefreshNeeded();
});
</script>

<template>
  <view class="min-h-screen bg-page-bg px-[24rpx] pb-[180rpx] pt-safe">
    <view
      class="rounded-[32rpx] bg-brand-gradient px-[28rpx] pb-[38rpx] pt-[28rpx] text-on-brand"
    >
      <text class="text-[40rpx] font-[700]">复习中心</text>
      <text class="mt-[12rpx] block text-[24rpx] text-on-brand-muted"
        >首页已接通真实复习入口；004 复习流程交付后，这里会承载真实列表与执行流。</text
      >
    </view>

    <view
      class="mt-[24rpx] card-surface p-[28rpx] text-[28rpx] leading-[1.8] text-text-secondary"
    >
      当前页面保留明确占位反馈，但已经作为首页“开始复习”的真实导航目标，便于完成 002
      首页关键操作链路与返回刷新逻辑的联调。
    </view>

    <KnowledgeEntryFab />
    <AppTabBar active="review" />
  </view>
</template>