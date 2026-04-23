<script setup lang="ts">
import { ref } from "vue";
import { onBackPress, onLoad, onUnload } from "@dcloudio/uni-app";

import FeynmanComposer from "@/components/review/FeynmanComposer.vue";
import FeynmanHeader from "@/components/review/FeynmanHeader.vue";
import FeynmanPromptCard from "@/components/review/FeynmanPromptCard.vue";
import FeynmanTaskBanner from "@/components/review/FeynmanTaskBanner.vue";
import ReviewResultSheet from "@/components/review/ReviewResultSheet.vue";
import { useReviewSession } from "@/composables/useReviewSession";
import { pinia } from "@/stores";
import { useReviewStore } from "@/stores/review";

const reviewStore = useReviewStore(pinia);
const {
  canSubmit,
  characterCount,
  closeResultSheet,
  draft,
  loadTask,
  loading,
  prompt,
  retrySubmit,
  submitCurrentTask,
  submitFailureMessage,
  submitResult,
  submitting,
  task,
  updateDraft,
} = useReviewSession();

const allowNativeBack = ref(false);

function resolveTaskId(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function showMessage(message: string) {
  uni.showToast({
    title: message,
    icon: "none",
    duration: 2200,
  });
}

function leavePage() {
  reviewStore.clearSession();
  reviewStore.clearSubmitResult();

  const pages = getCurrentPages();
  if (pages.length > 1) {
    allowNativeBack.value = true;
    uni.navigateBack();
    return;
  }

  uni.reLaunch({ url: "/pages/review/index?tab=pending" });
}

async function handleSubmit() {
  await submitCurrentTask();
}

function handleBack() {
  if (submitting.value) {
    showMessage("正在提交复习结果，请稍候");
    return;
  }

  leavePage();
}

onLoad((options) => {
  const taskId = resolveTaskId(options?.taskId);
  void loadTask(taskId);
});

onBackPress(() => {
  if (allowNativeBack.value) {
    allowNativeBack.value = false;
    return false;
  }

  handleBack();
  return true;
});

onUnload(() => {
  reviewStore.clearSession();
  reviewStore.clearSubmitResult();
});
</script>

<template>
  <view
    class="min-h-screen bg-[linear-gradient(180deg,var(--review-hero-top),var(--page-bg))] pb-[40rpx]"
  >
    <view v-if="task && prompt" class="px-[24rpx] pb-[24rpx]">
      <FeynmanHeader :task="task" @back="handleBack" />
      <FeynmanTaskBanner :task="task" />
      <FeynmanPromptCard :prompt="prompt" />
      <FeynmanComposer
        :model-value="draft"
        :character-count="characterCount"
        :min-recommended-chars="prompt.minRecommendedChars"
        :disabled="!canSubmit"
        :submitting="submitting"
        @update:model-value="updateDraft"
        @submit="handleSubmit"
      />
    </view>

    <view v-else-if="loading" class="px-[24rpx] pt-safe">
      <view
        class="review-card mt-[24rpx] px-[24rpx] py-[28rpx] text-[24rpx] text-text-secondary"
      >
        正在加载复习任务...
      </view>
    </view>

    <view v-else class="px-[24rpx] pt-safe">
      <view
        class="review-card mt-[24rpx] px-[24rpx] py-[28rpx] text-[24rpx] text-text-secondary"
      >
        当前任务暂不可用，请返回列表刷新后重试。
      </view>
    </view>

    <ReviewResultSheet
      :visible="Boolean(submitResult || submitFailureMessage)"
      :failure-message="submitFailureMessage"
      :result="submitResult"
      :allow-retry="Boolean(submitFailureMessage)"
      @close="closeResultSheet"
      @retry="retrySubmit"
    />
  </view>
</template>
