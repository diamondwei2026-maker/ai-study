export const TOPIC_TITLE_MAX_LENGTH = 30;

export interface ExistingKnowledgePointPreview {
  id: string;
  title: string;
  canonicalTitle: string;
  firstReviewAt: string;
}

export interface ReviewPlanNodeSummary {
  sequence: number;
  label: string;
  dueAt: string;
}

export interface ReviewPlanSummary {
  totalNodes: number;
  nextDueAt: string;
  nodes: ReviewPlanNodeSummary[];
}

export interface TopicCreationResult {
  knowledgePoint: {
    id: string;
    title: string;
    canonicalTitle: string;
    createdAt: string;
    firstReviewAt: string;
  };
  standardAnswer: {
    id: string;
    canonicalTitle: string;
    content: string;
    source: "reused" | "generated";
  };
  reviewPlan: ReviewPlanSummary;
}

export interface TopicRequestErrorData {
  existingKnowledgePoint?: ExistingKnowledgePointPreview | null;
}

export type TopicFeedbackStatus = "success" | "conflict" | "failure";
