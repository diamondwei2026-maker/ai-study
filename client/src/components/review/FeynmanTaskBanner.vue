<script setup lang="ts">
import { computed } from "vue";

import type { ReviewTaskDetail } from "@/types/review";

const props = defineProps<{
  task: ReviewTaskDetail;
}>();

function pad(value: number) {
  return String(value).padStart(2, "0");
}

const dueLabel = computed(() => {
  const date = new Date(props.task.dueAt);
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
});
</script>

<template>
  <view class="review-card mt-[24rpx] px-[24rpx] py-[22rpx]">
    <view class="flex items-center justify-between gap-[16rpx]">
      <text class="text-[28rpx] font-[700] text-text-primary">当前任务</text>
      <text
        class="rounded-[999rpx] px-[16rpx] py-[8rpx] text-[20rpx] font-[700]"
        :class="
          task.status === 'overdue'
            ? 'bg-[rgba(244,134,86,0.12)] text-review-medium'
            : 'bg-[rgba(91,69,245,0.1)] text-brand-primary'
        "
        >{{ task.status === "overdue" ? "已过期" : "待处理" }}</text
      >
    </view>

    <text
      class="mt-[14rpx] block text-[24rpx] leading-[1.7] text-text-secondary"
      >计划节点：{{ task.planLabel }} · 截止 {{ dueLabel }}</text
    >
    <text
      class="mt-[10rpx] block text-[24rpx] leading-[1.7] text-text-secondary"
      >{{ task.overdueDescription }}</text
    >
  </view>
</template>
