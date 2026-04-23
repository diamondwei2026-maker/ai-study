<script setup lang="ts">
import type { ReviewTab } from "@/types/review";

const props = defineProps<{
  tab: ReviewTab;
}>();

const descriptionMap: Record<ReviewTab, string> = {
  pending: "当前没有待复习任务，去新建知识点继续积累输入。",
  overdue: "暂无过期任务，当前节奏控制得不错。",
  all: "当前没有可展示的复习任务，稍后刷新再看。",
};
</script>

<template>
  <view class="review-card mt-[24rpx] px-[24rpx] py-[36rpx] text-center">
    <text class="block text-[56rpx] leading-none">○</text>
    <text class="mt-[16rpx] block text-[30rpx] font-[700] text-text-primary">{{
      props.tab === "overdue" ? "暂无积压" : "任务已清空"
    }}</text>
    <text
      class="mt-[10rpx] block text-[24rpx] leading-[1.7] text-text-secondary"
      >{{ descriptionMap[props.tab] }}</text
    >
  </view>
</template>
