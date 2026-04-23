<script setup lang="ts">
import type { ReviewTaskDetail } from "@/types/review";

defineProps<{
  task: ReviewTaskDetail;
}>();

const emit = defineEmits<{
  (event: "back"): void;
}>();
</script>

<template>
  <view class="px-[24rpx] pt-safe">
    <view class="flex items-center gap-[16rpx] py-[18rpx]">
      <view
        class="center-flex h-[74rpx] w-[74rpx] rounded-full bg-surface-card text-[34rpx] shadow-review-panel"
        @click="emit('back')"
      >
        ←
      </view>
      <view class="min-w-0 flex-1">
        <text class="block text-[34rpx] font-[700] text-text-primary">{{
          task.knowledgePointTitle
        }}</text>
        <text class="mt-[6rpx] block text-[22rpx] text-text-secondary">{{
          task.planLabel
        }}</text>
      </view>
    </view>

    <view
      class="mt-[10rpx] h-[8rpx] overflow-hidden rounded-full bg-[rgba(255,255,255,0.72)]"
    >
      <view
        class="h-full w-[68%] rounded-full bg-[linear-gradient(90deg,var(--review-accent),#ffbc76)]"
      ></view>
    </view>
  </view>
</template>
