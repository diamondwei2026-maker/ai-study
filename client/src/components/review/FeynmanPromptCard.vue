<script setup lang="ts">
import type { ReviewFeynmanPrompt } from "@/types/review";

defineProps<{
  prompt: ReviewFeynmanPrompt;
}>();
</script>

<template>
  <view class="review-card mt-[18rpx] px-[24rpx] py-[22rpx]">
    <text class="block text-[28rpx] font-[700] text-text-primary">{{
      prompt.title
    }}</text>
    <text
      class="mt-[12rpx] block text-[24rpx] leading-[1.7] text-text-secondary"
      >{{ prompt.description }}</text
    >

    <view class="mt-[16rpx] flex flex-wrap gap-[12rpx]">
      <text
        class="rounded-[999rpx] bg-review-accent-soft px-[14rpx] py-[8rpx] text-[20rpx] font-[600] text-review-accent"
      >
        建议不少于 {{ prompt.minRecommendedChars }} 字
      </text>
      <text
        class="rounded-[999rpx] bg-[rgba(91,69,245,0.08)] px-[14rpx] py-[8rpx] text-[20rpx] font-[600] text-brand-primary"
      >
        仅支持纯文字
      </text>
    </view>
  </view>
</template>
