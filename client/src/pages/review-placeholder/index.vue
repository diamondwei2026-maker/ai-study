<script setup lang="ts">
import AppTabBar from "@/components/shared/navigation/AppTabBar.vue";
import KnowledgeEntryFab from "@/components/shared/navigation/KnowledgeEntryFab.vue";
</script>

<template>
  <view class="min-h-screen bg-page-bg px-[24rpx] pb-[180rpx] pt-safe">
    <view
      class="rounded-[32rpx] bg-brand-gradient px-[28rpx] pb-[38rpx] pt-[28rpx] text-on-brand"
    >
      <text class="text-[40rpx] font-[700]">复习占位页</text>
      <text class="mt-[12rpx] block text-[24rpx] text-on-brand-muted"
        >004 复习流程尚未交付，这里展示明确的不可用提示。</text
      >
    </view>

    <view
      class="mt-[24rpx] card-surface p-[28rpx] text-[28rpx] leading-[1.8] text-text-secondary"
    >
      复习入口已经纳入统一底部导航，但真实的复习列表、节点状态和提醒流要等到 004
      模块一起落地。
    </view>

    <KnowledgeEntryFab />
    <AppTabBar active="review" />
  </view>
</template>
