<script setup lang="ts">
import AppTabBar from "@/components/shared/navigation/AppTabBar.vue";
import KnowledgeEntryFab from "@/components/shared/navigation/KnowledgeEntryFab.vue";
</script>

<template>
  <view class="min-h-screen bg-page-bg px-[24rpx] pb-[180rpx] pt-safe">
    <view
      class="rounded-[32rpx] bg-brand-gradient px-[28rpx] pb-[38rpx] pt-[28rpx] text-on-brand"
    >
      <text class="text-[40rpx] font-[700]">首页占位页</text>
      <text class="mt-[12rpx] block text-[24rpx] text-on-brand-muted"
        >002 首页模块尚未交付，这里保留明确占位反馈。</text
      >
    </view>

    <view
      class="mt-[24rpx] card-surface p-[28rpx] text-[28rpx] leading-[1.8] text-text-secondary"
    >
      首页导航已经接通，但当前仓库仍在实现 001
      登录与账号管理模块，因此首页内容暂时不可用。后续完成 002
      时，这个入口会被真实 dashboard 页面替换。
    </view>

    <KnowledgeEntryFab />
    <AppTabBar active="home" />
  </view>
</template>
