export type ReviewTab = "pending" | "overdue" | "all";
export type ReviewOverdueLevel = "short" | "medium" | "long";
export type ReviewJudgment = "MASTERED" | "FUZZY" | "UNMASTERED";
export type ReviewNodeType = "initial" | "reinforcement" | "continuation";
export type ReviewReminderKind = "pre_due" | "overdue_1h" | "overdue_24h";
export type ReviewReminderStatus =
  | "scheduled"
  | "sent"
  | "canceled"
  | "skipped";

export interface ReviewReminderPolicy {
  preDueMinutes: number;
  overdueReminderMinutes: [number, number];
  maxOverdueReminders: number;
}

export interface ReviewSummary {
  pendingCount: number;
  overdueCount: number;
  allCount: number;
  showOverdueAlert: boolean;
  pinnedKnowledgePointIds: string[];
}

export interface ReviewTaskListItem {
  taskId: string;
  knowledgePointId: string;
  knowledgePointTitle: string;
  status: "pending" | "overdue";
  overdueLevel?: ReviewOverdueLevel;
  dueAt: string;
  isPinned: boolean;
  overdueCountForKnowledgePoint: number;
  nextReminderAt?: string;
  routeTarget: string;
}

export interface ReviewListResponse {
  summary: ReviewSummary;
  reminderPolicy: ReviewReminderPolicy;
  tasks: ReviewTaskListItem[];
}

export interface ReviewTaskDetail {
  taskId: string;
  knowledgePointId: string;
  knowledgePointTitle: string;
  planLabel: string;
  status: "pending" | "overdue";
  overdueLevel?: ReviewOverdueLevel;
  dueAt: string;
  overdueDescription: string;
}

export interface ReviewFeynmanPrompt {
  title: string;
  description: string;
  minRecommendedChars: number;
  pureTextOnly: true;
}

export interface ReviewTaskDetailResponse {
  task: ReviewTaskDetail;
  feynmanPrompt: ReviewFeynmanPrompt;
}

export interface ReviewSubmitResult {
  attemptId: string;
  result: {
    judgment: ReviewJudgment;
    reason: string;
    planAdjustmentKey: string;
  };
  taskUpdate: {
    status: "completed";
    completedAt: string;
    nextDueAt: string;
  };
  followUpNodes: Array<{
    nodeType: ReviewNodeType;
    dueAt: string;
  }>;
  redirectTarget: string;
}

export interface ReviewReminderMetadata {
  localReminderId: string;
  reviewNodeId: string;
  reminderKind: ReviewReminderKind;
  scheduledFor: string;
  notificationStatus: ReviewReminderStatus;
  routeTarget: string;
  createdAt: string;
  updatedAt: string;
}
