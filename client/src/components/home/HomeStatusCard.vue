<script setup lang="ts">
import { computed } from "vue";

import type { ReviewStatusSummary } from "@/types/home";

const props = defineProps<{
  reviewStatus: ReviewStatusSummary;
  usingSnapshot?: boolean;
}>();

const rightValue = computed(() =>
  props.reviewStatus.overdueCount > 0
    ? props.reviewStatus.overdueCount
    : props.reviewStatus.completedToday,
);

const rightLabel = computed(() => {
  if (props.reviewStatus.overdueCount > 0) {
    return "过期未复习";
  }

  if (props.reviewStatus.statusKind === "UNAVAILABLE") {
    return "状态同步中";
  }

  return "今日已完成";
});

const summaryText = computed(() => {
  if (props.usingSnapshot) {
    return "当前使用最近一次成功快照作为兜底展示";
  }

  if (props.reviewStatus.statusKind === "OVERDUE") {
    return `今日目标 ${props.reviewStatus.todayTarget ?? props.reviewStatus.pendingCount}，请优先处理逾期任务。`;
  }

  if (props.reviewStatus.statusKind === "PENDING") {
    return `今日目标 ${props.reviewStatus.todayTarget ?? props.reviewStatus.pendingCount}，保持当前节奏。`;
  }

  if (props.reviewStatus.statusKind === "EMPTY") {
    return "当前没有待复习任务，先继续积累新的知识点。";
  }

  return "聚合状态同步中，关键入口仍可继续使用。";
});
</script>

<template>
  <view class="hero-glass px-[28rpx] py-[30rpx] text-on-brand">
    <text class="block text-[24rpx] text-on-brand-muted">今日学习状态</text>

    <view class="mt-[18rpx] flex items-center">
      <view class="flex-1">
        <text class="block text-[72rpx] font-[700] leading-none">{{ reviewStatus.pendingCount }}</text>
        <text class="mt-[14rpx] block text-[24rpx] text-on-brand-muted">今日待复习</text>
      </view>

      <view class="mx-[18rpx] h-[92rpx] w-[1rpx] bg-[rgba(255,255,255,0.2)]"></view>

      <view class="flex-1 text-right">
        <text class="block text-[60rpx] font-[700] leading-none text-home-signal">{{ rightValue }}</text>
        <text class="mt-[14rpx] block text-[24rpx] text-home-signal">{{ rightLabel }}</text>
      </view>
    </view>

    <text class="mt-[18rpx] block text-[22rpx] leading-[1.6] text-on-brand-muted">{{ summaryText }}</text>
  </view>
</template>