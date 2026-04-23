<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  characterCount: number;
  minRecommendedChars: number;
  disabled: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "submit"): void;
}>();

function handleInput(event: { detail?: { value?: string } }) {
  emit("update:modelValue", event.detail?.value ?? "");
}
</script>

<template>
  <view class="mt-[18rpx] pb-[220rpx]">
    <view class="review-card px-[24rpx] py-[22rpx]">
      <textarea
        :value="props.modelValue"
        :disabled="submitting"
        :maxlength="2000"
        class="h-[420rpx] w-full rounded-[24rpx] bg-review-input-bg px-[20rpx] py-[20rpx] text-[28rpx] leading-[1.8] text-text-primary"
        placeholder="试着讲给一个完全不懂的人听：它是什么、为什么重要、关键机制是什么。"
        placeholder-class="text-[26rpx] text-topic-hint"
        @input="handleInput"
      />

      <view
        class="mt-[16rpx] flex items-center justify-between text-[22rpx] text-text-secondary"
      >
        <text>
          {{
            props.characterCount >= props.minRecommendedChars
              ? "内容长度已达建议值"
              : `当前 ${props.characterCount} 字，建议至少 ${props.minRecommendedChars} 字`
          }}
        </text>
        <text>{{ props.characterCount }}/2000</text>
      </view>
    </view>

    <view
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-topic-footer-surface px-[24rpx] pb-safe pt-[18rpx] shadow-topic-footer"
    >
      <view class="flex items-center gap-[18rpx]">
        <view
          class="min-w-0 flex-1 text-[22rpx] leading-[1.6] text-text-secondary"
        >
          提交后将触发 AI 判定、计划调整并刷新复习列表。
        </view>
        <view
          class="center-flex rounded-[999rpx] px-[32rpx] py-[18rpx] text-[26rpx] font-[700] text-on-brand"
          :class="
            props.disabled
              ? 'bg-topic-disabled-bg text-topic-disabled-text'
              : 'bg-brand-gradient'
          "
          @click="!props.disabled && emit('submit')"
        >
          {{ props.submitting ? "提交中..." : "提交复习" }}
        </view>
      </view>
    </view>
  </view>
</template>
