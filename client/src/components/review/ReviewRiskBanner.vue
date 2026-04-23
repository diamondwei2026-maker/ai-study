<script setup lang="ts">
defineProps<{
  overdueCount: number;
  pinnedCount: number;
}>();
</script>

<template>
  <view
    class="mt-[20rpx] rounded-[28rpx] border border-review-banner-border bg-review-banner-bg px-[22rpx] py-[20rpx] shadow-review-panel"
  >
    <text class="block text-[28rpx] font-[700] text-review-accent"
      >复习风险提示</text
    >
    <text
      class="mt-[10rpx] block text-[24rpx] leading-[1.7] text-text-secondary"
      >当前共有 {{ overdueCount }} 个过期任务，其中
      {{ pinnedCount }} 个知识点已进入反复过期区，建议优先清空长期积压项。</text
    >
  </view>
</template>
