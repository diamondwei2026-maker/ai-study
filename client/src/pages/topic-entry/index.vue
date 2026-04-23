<script setup lang="ts">
import { onBackPress, onUnload } from "@dcloudio/uni-app";
import { ref } from "vue";

import CreationResultCard from "@/components/topic-entry/CreationResultCard.vue";
import TopicEntryFooterBar from "@/components/topic-entry/TopicEntryFooterBar.vue";
import TopicEntryNavBar from "@/components/topic-entry/TopicEntryNavBar.vue";
import TopicEntryNoticeCard from "@/components/topic-entry/TopicEntryNoticeCard.vue";
import TopicTitleForm from "@/components/topic-entry/TopicTitleForm.vue";
import { useTopicEntry } from "@/composables/useTopicEntry";

const {
  title,
  submitting,
  characterCount,
  validationMessage,
  creationResult,
  conflictResult,
  failureMessage,
  feedbackStatus,
  canSubmit,
  hasUnsavedChanges,
  submitLabel,
  updateTitle,
  submit,
  reset,
} = useTopicEntry();

const allowNativeBack = ref(false);

function showMessage(message: string) {
  uni.showToast({
    title: message,
    icon: "none",
    duration: 2200,
  });
}

function leavePage() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    allowNativeBack.value = true;
    uni.navigateBack();
    return;
  }

  reset();
  uni.reLaunch({ url: "/pages/home/index" });
}

function confirmDiscardChanges() {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: "放弃本次录入？",
      content: "当前输入不会自动保存，返回后需要重新填写。",
      confirmText: "放弃",
      cancelText: "继续编辑",
      success: (result) => {
        resolve(Boolean(result.confirm));
      },
      fail: () => {
        resolve(false);
      },
    });
  });
}

async function handleBack() {
  if (submitting.value) {
    showMessage("正在生成中，请稍候");
    return;
  }

  if (!hasUnsavedChanges.value) {
    leavePage();
    return;
  }

  const confirmed = await confirmDiscardChanges();
  if (!confirmed) {
    return;
  }

  reset();
  leavePage();
}

async function handleSubmit() {
  const succeeded = await submit();

  if (succeeded) {
    uni.pageScrollTo({
      scrollTop: 560,
      duration: 240,
    });
  }
}

onBackPress(() => {
  if (allowNativeBack.value) {
    allowNativeBack.value = false;
    return false;
  }

  void handleBack();
  return true;
});

onUnload(() => {
  reset();
});
</script>

<template>
  <view class="min-h-screen bg-page-bg pb-[220rpx]">
    <TopicEntryNavBar :submitting="submitting" @back="handleBack" />

    <view class="px-[24rpx] pb-[48rpx]">
      <TopicTitleForm
        :model-value="title"
        :character-count="characterCount"
        :error-message="validationMessage"
        :submitting="submitting"
        @update:model-value="updateTitle"
      />

      <view class="mt-[24rpx]">
        <TopicEntryNoticeCard />
      </view>

      <view v-if="feedbackStatus" class="mt-[24rpx]">
        <CreationResultCard
          :status="feedbackStatus"
          :result="creationResult"
          :conflict="conflictResult"
          :failure-message="failureMessage"
        />
      </view>
    </view>

    <TopicEntryFooterBar
      :disabled="!canSubmit"
      :loading="submitting"
      :label="submitLabel"
      @submit="handleSubmit"
    />
  </view>
</template>
