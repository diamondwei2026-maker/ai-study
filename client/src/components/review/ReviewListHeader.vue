<script setup lang="ts">
import type { ReviewSummary } from "@/types/review";

defineProps<{
  summary: ReviewSummary;
}>();
</script>

<template>
  <view
    class="rounded-[36rpx] border border-[rgba(255,255,255,0.58)] bg-[linear-gradient(180deg,var(--review-hero-top),var(--review-hero-bottom))] px-[28rpx] pb-[34rpx] pt-[28rpx] shadow-review-panel"
  >
    <view class="flex items-start justify-between gap-[20rpx]">
      <view>
        <text class="block text-[42rpx] font-[700] text-text-primary"
          >复习任务</text
        >
        <text
          class="mt-[10rpx] block text-[24rpx] leading-[1.7] text-text-secondary"
          >优先处理过期和重复积压的知识点，完成后会自动刷新下一次复习时间。</text
        >
      </view>

      <view
        class="rounded-[999rpx] bg-[rgba(255,255,255,0.7)] px-[20rpx] py-[14rpx] text-[22rpx] font-[600] text-review-accent"
      >
        总计 {{ summary.allCount }} 项
      </view>
    </view>

    <view class="mt-[26rpx] grid grid-cols-3 gap-[16rpx]">
      <view class="review-card px-[18rpx] py-[18rpx]">
        <text class="block text-[22rpx] text-text-secondary">待复习</text>
        <text
          class="mt-[10rpx] block text-[38rpx] font-[700] text-text-primary"
          >{{ summary.pendingCount }}</text
        >
      </view>
      <view class="review-card px-[18rpx] py-[18rpx]">
        <text class="block text-[22rpx] text-text-secondary">过期任务</text>
        <text
          class="mt-[10rpx] block text-[38rpx] font-[700] text-review-medium"
          >{{ summary.overdueCount }}</text
        >
      </view>
      <view class="review-card px-[18rpx] py-[18rpx]">
        <text class="block text-[22rpx] text-text-secondary">置顶提醒</text>
        <text
          class="mt-[10rpx] block text-[38rpx] font-[700] text-review-accent"
          >{{ summary.pinnedKnowledgePointIds.length }}</text
        >
      </view>
    </view>
  </view>
</template>
