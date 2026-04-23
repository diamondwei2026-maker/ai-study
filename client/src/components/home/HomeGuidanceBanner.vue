<script setup lang="ts">
import { computed } from "vue";

import type { HomeGuidanceSuggestion } from "@/types/home";

const props = defineProps<{
  guidance: HomeGuidanceSuggestion;
  actionLabel?: string;
}>();

defineEmits<{
  action: [];
}>();

const pillText = computed(() => {
  if (props.actionLabel) {
    return props.actionLabel;
  }

  return props.guidance.suggestedActionKey === "createTopic"
    ? "去新建知识点"
    : "去开始复习";
});
</script>

<template>
  <view
    class="rounded-[28rpx] border border-home-banner-border bg-home-banner-bg px-[24rpx] py-[24rpx]"
    @click="$emit('action')"
  >
    <view class="flex items-start gap-[18rpx]">
      <view
        class="center-flex mt-[4rpx] h-[52rpx] w-[52rpx] rounded-[16rpx] bg-home-banner-pill text-[24rpx] font-[700] text-home-banner-text"
      >
        !
      </view>

      <view class="flex-1">
        <text
          class="block text-[28rpx] font-[700] leading-[1.5] text-home-banner-text"
          >{{ guidance.title }}</text
        >
        <text
          class="mt-[8rpx] block text-[22rpx] leading-[1.7] text-home-banner-muted"
          >{{ guidance.description }}</text
        >

        <view
          class="mt-[16rpx] inline-flex items-center rounded-[999rpx] bg-home-banner-pill px-[18rpx] py-[10rpx]"
        >
          <text class="text-[22rpx] font-[700] text-home-banner-text">{{
            pillText
          }}</text>
          <text class="ml-[10rpx] text-[22rpx] text-home-banner-text">›</text>
        </view>
      </view>
    </view>
  </view>
</template>
