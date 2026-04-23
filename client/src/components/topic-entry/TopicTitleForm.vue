<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  characterCount: number;
  errorMessage: string;
  submitting: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

function handleInput(event: { detail: { value: string } }) {
  emit("update:modelValue", event.detail.value ?? "");
}
</script>

<template>
  <view class="topic-card px-[28rpx] py-[30rpx]">
    <text class="text-[28rpx] font-[700] text-brand-primary">知识点标题</text>

    <view
      class="mt-[22rpx] rounded-[26rpx] border px-[22rpx] py-[20rpx]"
      :class="
        errorMessage
          ? 'border-danger-text bg-danger-surface'
          : 'border-topic-card-border bg-topic-input-bg'
      "
    >
      <textarea
        :value="props.modelValue"
        :maxlength="-1"
        :disabled="props.submitting"
        auto-height
        class="min-h-[176rpx] w-full text-[30rpx] leading-[1.8] text-text-primary"
        placeholder="例：Vue3 响应式原理、费曼学习法定义...
仅支持纯文字，建议 1-30 字"
        placeholder-class="text-topic-hint leading-[1.8]"
        placeholder-style="color: var(--topic-hint);"
        @input="handleInput"
      />
    </view>

    <view class="mt-[18rpx] flex items-center justify-between gap-[16rpx]">
      <text
        class="text-[22rpx]"
        :class="errorMessage ? 'text-danger-text' : 'text-topic-muted'"
      >
        {{ errorMessage || "仅支持纯文字，不限字数（建议 1-30 字）" }}
      </text>
      <text class="text-[22rpx] text-topic-muted">{{ characterCount }} 字</text>
    </view>
  </view>
</template>
