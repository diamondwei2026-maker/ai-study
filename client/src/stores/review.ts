import { defineStore } from "pinia";

import type {
  ReviewFeynmanPrompt,
  ReviewListResponse,
  ReviewReminderPolicy,
  ReviewSubmitResult,
  ReviewSummary,
  ReviewTab,
  ReviewTaskDetail,
  ReviewTaskListItem,
} from "@/types/review";

const DRAFT_STORAGE_KEY = "ai-study:review-drafts";

function readDraftStorage() {
  const snapshot = uni.getStorageSync(DRAFT_STORAGE_KEY) as
    | Record<string, string>
    | ""
    | null;

  return snapshot && typeof snapshot === "object" ? snapshot : {};
}

function defaultReminderPolicy(): ReviewReminderPolicy {
  return {
    preDueMinutes: 30,
    overdueReminderMinutes: [60, 1440],
    maxOverdueReminders: 2,
  };
}

function defaultSummary(): ReviewSummary {
  return {
    pendingCount: 0,
    overdueCount: 0,
    allCount: 0,
    showOverdueAlert: false,
    pinnedKnowledgePointIds: [],
  };
}

export const useReviewStore = defineStore("review", {
  state: () => ({
    selectedTab: "pending" as ReviewTab,
    tasks: [] as ReviewTaskListItem[],
    summary: defaultSummary(),
    reminderPolicy: defaultReminderPolicy(),
    listLoading: false,
    listError: "",
    currentTaskId: "",
    taskDetail: null as ReviewTaskDetail | null,
    feynmanPrompt: null as ReviewFeynmanPrompt | null,
    sessionLoading: false,
    submitting: false,
    submitResult: null as ReviewSubmitResult | null,
    submitFailureMessage: "",
    submitFailureCode: null as number | null,
    draftMap: {} as Record<string, string>,
    draftsHydrated: false,
    refreshOnNextShow: false,
  }),
  actions: {
    hydrateDrafts() {
      if (this.draftsHydrated) {
        return;
      }

      this.draftMap = readDraftStorage();
      this.draftsHydrated = true;
    },
    persistDrafts() {
      uni.setStorageSync(DRAFT_STORAGE_KEY, this.draftMap);
    },
    setSelectedTab(tab: ReviewTab) {
      this.selectedTab = tab;
    },
    startListLoading() {
      this.listLoading = true;
      this.listError = "";
    },
    finishListLoading() {
      this.listLoading = false;
    },
    setListData(payload: ReviewListResponse) {
      this.summary = payload.summary;
      this.reminderPolicy = payload.reminderPolicy;
      this.tasks = payload.tasks;
      this.listError = "";
    },
    setListError(message: string) {
      this.listError = message;
    },
    startSessionLoading(taskId: string) {
      this.currentTaskId = taskId;
      this.sessionLoading = true;
    },
    finishSessionLoading() {
      this.sessionLoading = false;
    },
    setSessionData(payload: {
      task: ReviewTaskDetail;
      feynmanPrompt: ReviewFeynmanPrompt;
    }) {
      this.currentTaskId = payload.task.taskId;
      this.taskDetail = payload.task;
      this.feynmanPrompt = payload.feynmanPrompt;
    },
    clearSession() {
      this.currentTaskId = "";
      this.taskDetail = null;
      this.feynmanPrompt = null;
      this.sessionLoading = false;
    },
    startSubmitting() {
      this.submitting = true;
    },
    finishSubmitting() {
      this.submitting = false;
    },
    setSubmitResult(result: ReviewSubmitResult) {
      this.submitResult = result;
      this.submitFailureMessage = "";
      this.submitFailureCode = null;
    },
    clearSubmitResult() {
      this.submitResult = null;
      this.submitFailureMessage = "";
      this.submitFailureCode = null;
    },
    setSubmitFailure(message: string, code?: number) {
      this.submitFailureMessage = message;
      this.submitFailureCode = code ?? null;
      this.submitResult = null;
    },
    setDraft(taskId: string, content: string) {
      this.hydrateDrafts();
      this.draftMap = {
        ...this.draftMap,
        [taskId]: content,
      };
      this.persistDrafts();
    },
    clearDraft(taskId: string) {
      this.hydrateDrafts();

      if (!(taskId in this.draftMap)) {
        return;
      }

      const nextDraftMap = { ...this.draftMap };
      delete nextDraftMap[taskId];
      this.draftMap = nextDraftMap;
      this.persistDrafts();
    },
    loadDraft(taskId: string) {
      this.hydrateDrafts();
      return this.draftMap[taskId] ?? "";
    },
    markRefreshNeeded() {
      this.refreshOnNextShow = true;
    },
    clearRefreshFlag() {
      this.refreshOnNextShow = false;
    },
  },
});

export default useReviewStore;
