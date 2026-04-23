<script setup lang="ts">
import { computed } from "vue";

import type { ReviewTaskListItem } from "@/types/review";

const props = defineProps<{
  task: ReviewTaskListItem;
}>();

const emit = defineEmits<{
  (event: "select", taskId: string): void;
}>();

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(value: string) {
  const date = new Date(value);
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const badgeStyle = computed(() => {
  if (props.task.status === "pending") {
    return "bg-[rgba(91,69,245,0.1)] text-brand-primary";
  }

  if (props.task.overdueLevel === "long") {
    return "bg-[rgba(234,86,86,0.12)] text-review-long";
  }

  if (props.task.overdueLevel === "medium") {
    return "bg-[rgba(244,134,86,0.12)] text-review-medium";
  }

  return "bg-[rgba(247,170,93,0.12)] text-review-short";
});

const badgeText = computed(() => {
  if (props.task.status === "pending") {
    return "待复习";
  }

  return props.task.overdueLevel === "long"
    ? "长期过期"
    : props.task.overdueLevel === "medium"
      ? "中期过期"
      : "短期过期";
});
</script>

<template>
  <view
    class="review-card px-[24rpx] py-[24rpx]"
    @click="emit('select', task.taskId)"
  >
    <view class="flex items-start justify-between gap-[18rpx]">
      <view class="min-w-0 flex-1">
        <view class="flex items-center gap-[10rpx]">
          <text class="truncate text-[30rpx] font-[700] text-text-primary">{{
            task.knowledgePointTitle
          }}</text>
          <text
            v-if="task.isPinned"
            class="rounded-[999rpx] bg-review-accent px-[12rpx] py-[4rpx] text-[18rpx] font-[700] text-on-brand"
            >置顶</text
          >
        </view>
        <text class="mt-[12rpx] block text-[24rpx] text-text-secondary"
          >应复习时间 {{ formatDate(task.dueAt) }}</text
        >
      </view>

      <view
        :class="badgeStyle"
        class="rounded-[999rpx] px-[16rpx] py-[8rpx] text-[20rpx] font-[700]"
      >
        {{ badgeText }}
      </view>
    </view>

    <view
      class="mt-[18rpx] flex items-center justify-between text-[22rpx] text-text-secondary"
    >
      <text>累计过期 {{ task.overdueCountForKnowledgePoint }} 次</text>
      <text v-if="task.nextReminderAt"
        >下次提醒 {{ formatDate(task.nextReminderAt) }}</text
      >
      <text v-else>当前无后续提醒</text>
    </view>
  </view>
</template>
