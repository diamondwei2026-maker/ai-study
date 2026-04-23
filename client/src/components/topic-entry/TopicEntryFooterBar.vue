<script setup lang="ts">
defineProps<{
  disabled: boolean;
  loading: boolean;
  label: string;
}>();

const emit = defineEmits<{
  submit: [];
}>();
</script>

<template>
  <view
    class="fixed bottom-0 left-0 right-0 z-40 bg-topic-footer-surface shadow-topic-footer"
  >
    <view class="px-[24rpx] pb-safe pb-[24rpx] pt-[20rpx]">
      <view
        class="center-flex h-[96rpx] rounded-[28rpx] text-[30rpx] font-[700] transition-opacity duration-200"
        :class="
          disabled
            ? 'bg-topic-disabled-bg text-topic-disabled-text'
            : 'bg-brand-primary text-on-brand'
        "
        hover-class="opacity-90"
        @click="!disabled && emit('submit')"
      >
        {{ loading ? "正在生成..." : label }}
      </view>
    </view>
  </view>
</template>
