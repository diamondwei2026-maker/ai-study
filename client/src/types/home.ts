export type ReviewStatusKind = "PENDING" | "EMPTY" | "OVERDUE" | "UNAVAILABLE";

export type HomeGuidanceType =
  | "CREATE_FIRST"
  | "REVIEW_NOW"
  | "KEEP_MOMENTUM"
  | "CHECK_PROGRESS";

export type GuidancePriority = 1 | 2 | 3 | 4;

export type HomeActionKey = "createTopic" | "startReview" | "guidanceAction";
export type HomeActionResult = "success" | "blocked" | "failed";

export interface ReviewStatusSummary {
  statusKind: ReviewStatusKind;
  pendingCount: number;
  overdueCount: number;
  completedToday: number;
  todayTarget?: number;
  lastUpdatedAt?: string;
}

export interface PrimaryActionEntry {
  key: "createTopic" | "startReview";
  label: string;
  targetModule: string;
  enabled: boolean;
  priority: number;
  disabledReason: string | null;
}

export interface HomeGuidanceSuggestion {
  type: HomeGuidanceType;
  title: string;
  description: string;
  suggestedActionKey: PrimaryActionEntry["key"];
  reason: string;
}

export interface HomeDashboard {
  generatedAt: string;
  reviewStatus: ReviewStatusSummary;
  primaryActions: PrimaryActionEntry[];
  guidance: HomeGuidanceSuggestion;
}

export interface HomeActionEventPayload {
  actionKey: HomeActionKey;
  targetModule: string;
  guidanceType?: HomeGuidanceType;
  result: HomeActionResult;
  deviceInfo?: string;
}

export interface HomeActionContext {
  actionKey: PrimaryActionEntry["key"];
  targetModule: string;
  occurredAt: string;
}
