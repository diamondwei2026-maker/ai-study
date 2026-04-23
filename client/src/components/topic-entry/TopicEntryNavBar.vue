<script setup lang="ts">
defineProps<{
  submitting: boolean;
}>();

const emit = defineEmits<{
  back: [];
}>();
</script>

<template>
  <view class="px-[24rpx] pb-[18rpx] pt-safe">
    <view class="flex items-center justify-between gap-[20rpx]">
      <view class="flex items-center gap-[18rpx]">
        <view
          class="center-flex h-[64rpx] w-[64rpx] rounded-[18rpx] border border-topic-card-border bg-surface-card text-[28rpx] text-text-primary shadow-topic-card"
          hover-class="opacity-80"
          @click="!submitting && emit('back')"
        >
          <text class="translate-x-[-2rpx]">&lt;</text>
        </view>
        <text class="text-[36rpx] font-[700] text-text-primary"
          >新建知识点</text
        >
      </view>

      <text class="text-[22rpx] text-topic-muted">返回后数据不保存</text>
    </view>
  </view>
</template>
