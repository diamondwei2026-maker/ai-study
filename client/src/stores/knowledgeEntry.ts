import { defineStore } from "pinia";

import type {
  ExistingKnowledgePointPreview,
  TopicCreationResult,
} from "@/types/topic";

export const useKnowledgeEntryStore = defineStore("knowledgeEntry", {
  state: () => ({
    title: "",
    submitting: false,
    validationMessage: "",
    creationResult: null as TopicCreationResult | null,
    conflictResult: null as ExistingKnowledgePointPreview | null,
    failureMessage: "",
    failureCode: null as number | null,
  }),
  actions: {
    setTitle(title: string) {
      this.title = title;
      this.creationResult = null;
      this.conflictResult = null;
      this.failureMessage = "";
      this.failureCode = null;
    },
    setValidationMessage(message: string) {
      this.validationMessage = message;
    },
    startSubmitting() {
      this.submitting = true;
      this.validationMessage = "";
      this.conflictResult = null;
      this.failureMessage = "";
      this.failureCode = null;
    },
    finishSubmitting() {
      this.submitting = false;
    },
    setSuccess(result: TopicCreationResult) {
      this.creationResult = result;
      this.conflictResult = null;
      this.failureMessage = "";
      this.failureCode = null;
      this.validationMessage = "";
    },
    setConflict(existingKnowledgePoint: ExistingKnowledgePointPreview) {
      this.conflictResult = existingKnowledgePoint;
      this.creationResult = null;
      this.failureMessage = "";
      this.failureCode = 409;
      this.validationMessage = "";
    },
    setFailure(message: string, code?: number) {
      this.failureMessage = message;
      this.failureCode = code ?? null;
      this.creationResult = null;
      this.conflictResult = null;
    },
    resetAll() {
      this.title = "";
      this.submitting = false;
      this.validationMessage = "";
      this.creationResult = null;
      this.conflictResult = null;
      this.failureMessage = "";
      this.failureCode = null;
    },
  },
});

export default useKnowledgeEntryStore;
