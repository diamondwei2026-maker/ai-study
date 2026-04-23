import { computed } from "vue";

import { useHomeStore } from "@/stores/home";
import { useKnowledgeEntryStore } from "@/stores/knowledgeEntry";
import { pinia } from "@/stores";
import {
  TOPIC_TITLE_MAX_LENGTH,
  type ExistingKnowledgePointPreview,
  type TopicCreationResult,
  type TopicFeedbackStatus,
  type TopicRequestErrorData,
} from "@/types/topic";
import { request, type ApiEnvelope } from "@/utils/request";

const INVALID_TITLE_MESSAGE = "标题需为 1-30 字纯文字内容";
const DISALLOWED_TITLE_PATTERNS = [
  /https?:\/\/\S+/i,
  /\bwww\.\S+/i,
  /!\[[^\]]*\]\([^)]*\)/,
  /\[[^\]]+\]\([^)]*\)/,
  /<[^>]+>/,
  /```/,
  /`[^`]+`/,
  /(^|\s)#{1,6}\s/,
  /[\r\n]/,
];

interface TopicRequestError {
  statusCode?: number;
  message: string;
  existingKnowledgePoint?: ExistingKnowledgePointPreview | null;
}

function countCharacters(value: string) {
  return Array.from(value.trim()).length;
}

function normalizeTitle(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

function validateTitle(value: string) {
  const sanitizedTitle = value.trim();
  const characterCount = countCharacters(value);
  const normalizedTitle = normalizeTitle(sanitizedTitle);
  const valid =
    Boolean(sanitizedTitle) &&
    Boolean(normalizedTitle) &&
    characterCount >= 1 &&
    characterCount <= TOPIC_TITLE_MAX_LENGTH &&
    !DISALLOWED_TITLE_PATTERNS.some((pattern) => pattern.test(sanitizedTitle));

  return {
    valid,
    sanitizedTitle,
    normalizedTitle,
    characterCount,
    message: valid ? "" : INVALID_TITLE_MESSAGE,
  };
}

function parseRequestError(error: unknown): TopicRequestError {
  const requestError = error as {
    statusCode?: number;
    envelope?: ApiEnvelope<TopicRequestErrorData>;
  };

  return {
    statusCode: requestError.statusCode,
    message: requestError.envelope?.message ?? "创建失败，请稍后重试",
    existingKnowledgePoint:
      requestError.envelope?.data?.existingKnowledgePoint ?? null,
  };
}

export function useTopicEntry() {
  const homeStore = useHomeStore(pinia);
  const knowledgeEntryStore = useKnowledgeEntryStore(pinia);

  const title = computed(() => knowledgeEntryStore.title);
  const submitting = computed(() => knowledgeEntryStore.submitting);
  const validationMessage = computed(
    () => knowledgeEntryStore.validationMessage,
  );
  const creationResult = computed(() => knowledgeEntryStore.creationResult);
  const conflictResult = computed(() => knowledgeEntryStore.conflictResult);
  const failureMessage = computed(() => knowledgeEntryStore.failureMessage);
  const characterCount = computed(() =>
    countCharacters(knowledgeEntryStore.title),
  );
  const titleValidation = computed(() =>
    validateTitle(knowledgeEntryStore.title),
  );
  const feedbackStatus = computed<TopicFeedbackStatus | null>(() => {
    if (creationResult.value) {
      return "success";
    }

    if (conflictResult.value) {
      return "conflict";
    }

    if (failureMessage.value) {
      return "failure";
    }

    return null;
  });
  const alreadyCreatedCurrentTitle = computed(() => {
    if (!creationResult.value) {
      return false;
    }

    return (
      normalizeTitle(knowledgeEntryStore.title) ===
      normalizeTitle(creationResult.value.knowledgePoint.title)
    );
  });
  const canSubmit = computed(
    () =>
      titleValidation.value.valid &&
      !submitting.value &&
      !alreadyCreatedCurrentTitle.value,
  );
  const hasUnsavedChanges = computed(
    () => Boolean(knowledgeEntryStore.title.trim()) && !creationResult.value,
  );
  const submitLabel = computed(() => {
    if (submitting.value) {
      return "正在生成...";
    }

    if (alreadyCreatedCurrentTitle.value) {
      return "已创建完成";
    }

    return "保存并生成计划";
  });

  function updateTitle(nextTitle: string) {
    knowledgeEntryStore.setTitle(nextTitle);
    if (!nextTitle.trim()) {
      knowledgeEntryStore.setValidationMessage("");
      return;
    }

    knowledgeEntryStore.setValidationMessage(
      validateTitle(nextTitle).valid ? "" : INVALID_TITLE_MESSAGE,
    );
  }

  async function submit() {
    const validation = validateTitle(knowledgeEntryStore.title);
    if (!validation.valid) {
      knowledgeEntryStore.setValidationMessage(validation.message);
      return false;
    }

    knowledgeEntryStore.startSubmitting();

    try {
      const response = await request<TopicCreationResult, { title: string }>({
        url: "/topics",
        method: "POST",
        data: {
          title: validation.sanitizedTitle,
        },
        suppressErrorToast: true,
      });

      knowledgeEntryStore.setSuccess(response.data);
      homeStore.markRefreshNeeded();
      return true;
    } catch (error) {
      const normalizedError = parseRequestError(error);

      if (
        normalizedError.statusCode === 409 &&
        normalizedError.existingKnowledgePoint
      ) {
        knowledgeEntryStore.setConflict(normalizedError.existingKnowledgePoint);
        return false;
      }

      if (normalizedError.statusCode === 400) {
        knowledgeEntryStore.setValidationMessage(normalizedError.message);
        return false;
      }

      if (normalizedError.statusCode !== 401) {
        knowledgeEntryStore.setFailure(
          normalizedError.message,
          normalizedError.statusCode,
        );
      }

      return false;
    } finally {
      knowledgeEntryStore.finishSubmitting();
    }
  }

  function reset() {
    knowledgeEntryStore.resetAll();
  }

  return {
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
  };
}

export default useTopicEntry;
