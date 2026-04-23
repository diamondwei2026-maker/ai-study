<script setup lang="ts">
import { onHide } from "@dcloudio/uni-app";

import { pinia } from "@/stores";
import { useHomeStore } from "@/stores/home";

const homeStore = useHomeStore(pinia);

onHide(() => {
  homeStore.markRefreshNeeded();
});
</script>

<template>
  <view class="min-h-screen bg-page-bg px-[24rpx] pb-[48rpx] pt-safe">
    <view
      class="rounded-[32rpx] bg-brand-gradient px-[28rpx] pb-[38rpx] pt-[28rpx] text-on-brand"
    >
      <text class="text-[40rpx] font-[700]">知识点录入</text>
      <text class="mt-[12rpx] block text-[24rpx] text-on-brand-muted"
        >共享 FAB 已接入，后续 003 模块会在这里落真实录入流。</text
      >
    </view>

    <view
      class="mt-[24rpx] card-surface p-[28rpx] text-[28rpx] leading-[1.8] text-text-secondary"
    >
      当前占位页用于验证首页与后续模块之间的共享导航约定：FAB 固定跳转至
      topic-entry 路由，返回首页后会自动刷新状态。
    </view>
  </view>
</template>
