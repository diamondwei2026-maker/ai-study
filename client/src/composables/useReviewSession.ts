import { computed } from "vue";

import { pinia } from "@/stores";
import { useReviewStore } from "@/stores/review";
import type {
  ReviewSubmitResult,
  ReviewTaskDetailResponse,
} from "@/types/review";
import { cancelReviewReminderMetadata } from "@/utils/notification";
import { request } from "@/utils/request";

function showMessage(message: string) {
  uni.showToast({
    title: message,
    icon: "none",
    duration: 2200,
  });
}

function redirectToReviewList(url = "/pages/review/index?tab=pending") {
  uni.reLaunch({ url });
}

export function useReviewSession() {
  const reviewStore = useReviewStore(pinia);

  reviewStore.hydrateDrafts();

  const loading = computed(() => reviewStore.sessionLoading);
  const submitting = computed(() => reviewStore.submitting);
  const task = computed(() => reviewStore.taskDetail);
  const prompt = computed(() => reviewStore.feynmanPrompt);
  const submitResult = computed(() => reviewStore.submitResult);
  const submitFailureMessage = computed(() => reviewStore.submitFailureMessage);
  const draft = computed(
    () =>
      (reviewStore.currentTaskId
        ? reviewStore.loadDraft(reviewStore.currentTaskId)
        : "") ?? "",
  );
  const characterCount = computed(() => Array.from(draft.value.trim()).length);
  const canSubmit = computed(
    () => Boolean(draft.value.trim()) && !loading.value && !submitting.value,
  );

  async function loadTask(taskId: string) {
    if (!taskId) {
      redirectToReviewList();
      return null;
    }

    reviewStore.startSessionLoading(taskId);
    reviewStore.clearSubmitResult();

    try {
      const response = await request<ReviewTaskDetailResponse>({
        url: `/reviews/tasks/${taskId}`,
      });
      reviewStore.setSessionData(response.data);
      return response.data;
    } catch {
      showMessage("该复习任务状态已变化，请返回列表刷新后重试");
      redirectToReviewList();
      return null;
    } finally {
      reviewStore.finishSessionLoading();
    }
  }

  function updateDraft(content: string) {
    if (!reviewStore.currentTaskId) {
      return;
    }

    reviewStore.setDraft(reviewStore.currentTaskId, content);
  }

  async function submitCurrentTask() {
    if (!reviewStore.currentTaskId) {
      return false;
    }

    const content = draft.value.trim();
    if (!content) {
      showMessage("费曼输出不能为空，且仅支持纯文字内容");
      return false;
    }

    reviewStore.startSubmitting();
    reviewStore.clearSubmitResult();

    try {
      const response = await request<ReviewSubmitResult, { content: string }>({
        url: `/reviews/tasks/${reviewStore.currentTaskId}/submit`,
        method: "POST",
        data: { content },
      });
      reviewStore.setSubmitResult(response.data);
      reviewStore.clearDraft(reviewStore.currentTaskId);
      cancelReviewReminderMetadata(reviewStore.currentTaskId);
      reviewStore.markRefreshNeeded();
      return true;
    } catch (error) {
      const requestError = error as {
        statusCode?: number;
        envelope?: {
          message?: string;
        };
      };

      reviewStore.setSubmitFailure(
        requestError.envelope?.message ?? "本次复习未能完成更新，请稍后重试",
        requestError.statusCode,
      );
      return false;
    } finally {
      reviewStore.finishSubmitting();
    }
  }

  function closeResultSheet() {
    if (reviewStore.submitFailureMessage) {
      reviewStore.clearSubmitResult();
      return;
    }

    const redirectTarget = reviewStore.submitResult?.redirectTarget;
    reviewStore.clearSubmitResult();
    reviewStore.clearSession();
    redirectToReviewList(redirectTarget ?? "/pages/review/index?tab=pending");
  }

  async function retrySubmit() {
    reviewStore.clearSubmitResult();
    return submitCurrentTask();
  }

  return {
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
  };
}

export default useReviewSession;
