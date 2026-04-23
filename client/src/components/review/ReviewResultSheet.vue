<script setup lang="ts">
import { computed } from "vue";

import type { ReviewSubmitResult } from "@/types/review";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    result: ReviewSubmitResult | null;
    failureMessage?: string;
    allowRetry?: boolean;
  }>(),
  {
    allowRetry: false,
    failureMessage: "",
  },
);

const emit = defineEmits<{
  (event: "close"): void;
  (event: "retry"): void;
}>();

const resultTone = computed(() => {
  if (props.failureMessage) {
    return "text-review-long";
  }

  if (!props.result) {
    return "text-text-primary";
  }

  if (props.result.result.judgment === "MASTERED") {
    return "text-topic-success-text";
  }

  if (props.result.result.judgment === "FUZZY") {
    return "text-review-accent";
  }

  return "text-review-long";
});

const resultLabel = computed(() => {
  if (props.failureMessage) {
    return "更新失败";
  }

  if (!props.result) {
    return "";
  }

  return props.result.result.judgment === "MASTERED"
    ? "已掌握"
    : props.result.result.judgment === "FUZZY"
      ? "模糊"
      : "未掌握";
});

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(value: string) {
  const date = new Date(value);
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
</script>

<template>
  <view v-if="visible && (result || failureMessage)" class="fixed inset-0 z-60">
    <view class="absolute inset-0 bg-review-mask" @click="emit('close')"></view>

    <view
      class="absolute bottom-0 left-0 right-0 rounded-t-[40rpx] bg-surface-card px-[24rpx] pb-[36rpx] pt-[24rpx] shadow-review-sheet"
    >
      <view
        class="mx-auto h-[8rpx] w-[92rpx] rounded-full bg-border-subtle"
      ></view>

      <text class="mt-[22rpx] block text-[26rpx] text-text-secondary"
        >本次判定结果</text
      >
      <text
        class="mt-[10rpx] block text-[44rpx] font-[700]"
        :class="resultTone"
        >{{ resultLabel }}</text
      >
      <text
        class="mt-[14rpx] block text-[24rpx] leading-[1.8] text-text-secondary"
        >{{ failureMessage || result?.result.reason }}</text
      >

      <view v-if="result" class="review-card mt-[22rpx] px-[22rpx] py-[20rpx]">
        <text class="block text-[24rpx] text-text-secondary">下次复习</text>
        <text
          class="mt-[10rpx] block text-[34rpx] font-[700] text-text-primary"
          >{{ formatDate(result.taskUpdate.nextDueAt) }}</text
        >

        <view class="mt-[18rpx] flex flex-col gap-[12rpx]">
          <view
            v-for="(node, index) in result.followUpNodes"
            :key="`${node.nodeType}-${index}`"
            class="flex items-center justify-between rounded-[22rpx] bg-review-panel px-[18rpx] py-[16rpx]"
          >
            <text class="text-[22rpx] font-[600] text-text-primary">{{
              node.nodeType === "reinforcement"
                ? "短期补强"
                : node.nodeType === "continuation"
                  ? "延展节点"
                  : "主计划节点"
            }}</text>
            <text class="text-[22rpx] text-text-secondary">{{
              formatDate(node.dueAt)
            }}</text>
          </view>
        </view>
      </view>

      <view class="mt-[24rpx] flex gap-[16rpx]">
        <view
          v-if="allowRetry"
          class="center-flex flex-1 rounded-[999rpx] border border-border-subtle px-[24rpx] py-[18rpx] text-[26rpx] font-[700] text-text-primary"
          @click="emit('retry')"
        >
          再试一次
        </view>
        <view
          class="center-flex flex-1 rounded-[999rpx] bg-brand-gradient px-[24rpx] py-[18rpx] text-[26rpx] font-[700] text-on-brand"
          @click="emit('close')"
        >
          {{ failureMessage ? "继续编辑" : "返回列表" }}
        </view>
      </view>
    </view>
  </view>
</template>
