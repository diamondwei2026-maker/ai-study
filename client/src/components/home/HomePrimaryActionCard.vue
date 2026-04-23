<script setup lang="ts">
import { computed } from "vue";

import type { PrimaryActionEntry } from "@/types/home";

const props = defineProps<{
  action: PrimaryActionEntry | null;
  subtitle: string;
  recommended?: boolean;
}>();

defineEmits<{
  action: [];
}>();

const badgeText = computed(() => {
  if (!props.action?.enabled) {
    return "无任务时提供明确反馈";
  }

  return props.recommended ? "推荐动作" : "关键入口";
});
</script>

<template>
  <view
    class="relative overflow-hidden rounded-[36rpx] bg-brand-gradient px-[28rpx] py-[28rpx] shadow-hero"
    :class="action?.enabled ? '' : 'opacity-[0.8]'"
    @click="action && $emit('action')"
  >
    <view
      class="absolute right-[-36rpx] top-[-20rpx] h-[140rpx] w-[140rpx] rounded-full bg-[rgba(255,255,255,0.1)]"
    ></view>
    <view
      class="absolute left-[22rpx] top-[24rpx] h-[80rpx] w-[80rpx] rounded-[24rpx] bg-[rgba(255,255,255,0.08)]"
    ></view>

    <view class="relative z-10 flex items-center gap-[22rpx]">
      <view
        class="center-flex h-[92rpx] w-[92rpx] rounded-[28rpx] bg-[rgba(255,255,255,0.14)] text-[34rpx] font-[700] text-on-brand"
      >
        复
      </view>

      <view class="flex-1">
        <view
          class="inline-flex rounded-[999rpx] bg-[rgba(255,255,255,0.16)] px-[16rpx] py-[8rpx] text-[20rpx] text-on-brand-muted"
        >
          {{ badgeText }}
        </view>
        <text class="mt-[14rpx] block text-[38rpx] font-[700] text-on-brand">{{ action?.label ?? "开始复习" }}</text>
        <text class="mt-[10rpx] block text-[24rpx] leading-[1.6] text-on-brand-muted">{{ subtitle }}</text>
      </view>

      <view
        class="center-flex h-[72rpx] w-[72rpx] rounded-full bg-[rgba(255,255,255,0.18)] text-[30rpx] text-on-brand"
      >
        ›
      </view>
    </view>
  </view>
</template>