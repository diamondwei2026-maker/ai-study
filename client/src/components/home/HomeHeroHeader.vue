<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  lastUpdatedAt?: string;
  usingSnapshot?: boolean;
}>();

function formatTime(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

const helperText = computed(() => {
  if (props.usingSnapshot) {
    return "当前展示最近一次成功快照";
  }

  const time = formatTime(props.lastUpdatedAt);
  return time ? `状态更新于 ${time}` : "首页状态已同步";
});
</script>

<template>
  <view
    class="relative overflow-hidden bg-brand-gradient px-[32rpx] pb-[86rpx] pt-safe"
  >
    <view
      class="absolute right-[-88rpx] top-[-58rpx] h-[320rpx] w-[320rpx] rounded-full bg-[rgba(255,255,255,0.08)]"
    ></view>
    <view
      class="absolute left-[-72rpx] top-[132rpx] h-[240rpx] w-[240rpx] rounded-full bg-[rgba(255,255,255,0.08)]"
    ></view>

    <view class="relative z-10 pt-[26rpx]">
      <view class="flex items-center gap-[18rpx]">
        <view
          class="center-flex h-[74rpx] w-[74rpx] rounded-[24rpx] border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.16)] text-[30rpx] font-[700] text-on-brand"
        >
          记
        </view>
        <view>
          <text class="block text-[42rpx] font-[700] text-on-brand"
            >记忆助手</text
          >
          <text
            class="mt-[8rpx] block text-[22rpx] tracking-[2rpx] text-on-brand-muted"
            >智能复习 · 费曼输出</text
          >
        </view>
      </view>

      <text class="mt-[18rpx] block text-[22rpx] text-on-brand-muted">{{
        helperText
      }}</text>

      <view class="mt-[34rpx]">
        <slot />
      </view>
    </view>
  </view>
</template>
