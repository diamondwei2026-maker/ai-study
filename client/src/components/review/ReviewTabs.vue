<script setup lang="ts">
import { computed } from "vue";

import type { ReviewSummary, ReviewTab } from "@/types/review";

const props = defineProps<{
  modelValue: ReviewTab;
  summary: ReviewSummary;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: ReviewTab): void;
}>();

const tabs = computed(
  () =>
    [
      { key: "pending", label: "待复习", count: props.summary.pendingCount },
      { key: "overdue", label: "过期", count: props.summary.overdueCount },
      { key: "all", label: "全部", count: props.summary.allCount },
    ] as const,
);
</script>

<template>
  <view class="mt-[22rpx] flex gap-[14rpx] overflow-x-auto pb-[4rpx]">
    <view
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-pill flex items-center gap-[10rpx] border-review-panel-border bg-surface-card"
      :class="
        tab.key === modelValue ? 'review-tab-active' : 'text-text-secondary'
      "
      @click="emit('update:modelValue', tab.key)"
    >
      <text class="font-[600]">{{ tab.label }}</text>
      <text class="text-[20rpx] opacity-80">{{ tab.count }}</text>
    </view>
  </view>
</template>
