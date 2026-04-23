import { Types } from "mongoose";

import HomeActionEventModel, {
  type HomeActionKey,
  type HomeActionResult,
  type HomeGuidanceType,
} from "../models/HomeActionEvent.js";
import ReviewTaskModel from "../models/ReviewTask.js";
import UserModel from "../models/User.js";
import type { RequestMeta } from "../utils/requestMeta.js";
import { AppError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export type ReviewStatusKind =
  | "PENDING"
  | "EMPTY"
  | "OVERDUE"
  | "UNAVAILABLE";

export interface ReviewStatusSummary {
  statusKind: ReviewStatusKind;
  pendingCount: number;
  overdueCount: number;
  completedToday: number;
  todayTarget?: number;
  lastUpdatedAt?: Date;
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
  generatedAt: Date;
  reviewStatus: ReviewStatusSummary;
  primaryActions: PrimaryActionEntry[];
  guidance: HomeGuidanceSuggestion;
}

export interface RecordHomeActionEventInput {
  actionKey: HomeActionKey;
  targetModule: string;
  guidanceType?: HomeGuidanceType;
  result: HomeActionResult;
  deviceInfo?: string;
}

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfToday() {
  const value = new Date();
  value.setHours(23, 59, 59, 999);
  return value;
}

function buildFallbackReviewStatus(): ReviewStatusSummary {
  return {
    statusKind: "UNAVAILABLE",
    pendingCount: 0,
    overdueCount: 0,
    completedToday: 0,
  };
}

function buildPrimaryActions(
  reviewStatus: ReviewStatusSummary,
): PrimaryActionEntry[] {
  const reviewEnabled =
    reviewStatus.statusKind === "PENDING" || reviewStatus.statusKind === "OVERDUE";

  const disabledReason =
    reviewStatus.statusKind === "UNAVAILABLE"
      ? "首页状态暂不可用，请稍后重试"
      : reviewStatus.statusKind === "EMPTY"
        ? "当前暂无待复习任务，先去新建知识点吧"
        : null;

  return [
    {
      key: "startReview",
      label: "开始复习",
      targetModule: "review.start",
      enabled: reviewEnabled,
      priority: 1,
      disabledReason,
    },
    {
      key: "createTopic",
      label: "新建知识点",
      targetModule: "topic.create",
      enabled: true,
      priority: 2,
      disabledReason: null,
    },
  ];
}

function buildGuidance(
  reviewStatus: ReviewStatusSummary,
  nickname: string,
): HomeGuidanceSuggestion {
  if (reviewStatus.statusKind === "OVERDUE") {
    return {
      type: "REVIEW_NOW",
      title: "以下知识点累计过期 3 次以上，需重点关注：",
      description: `优先清理 ${reviewStatus.overdueCount} 个逾期任务，避免遗忘继续放大。`,
      suggestedActionKey: "startReview",
      reason: "存在逾期任务",
    };
  }

  if (reviewStatus.statusKind === "PENDING") {
    return {
      type: "KEEP_MOMENTUM",
      title: `${nickname}，今天继续保持输出节奏`,
      description: `还有 ${reviewStatus.pendingCount} 个知识点等待完成费曼输出。`,
      suggestedActionKey: "startReview",
      reason: "存在待复习任务",
    };
  }

  if (reviewStatus.statusKind === "EMPTY") {
    return {
      type: "CREATE_FIRST",
      title: "当前没有待复习任务，先沉淀新的知识点吧",
      description: "先补充新知识点，系统会在后续自动衔接复习计划。",
      suggestedActionKey: "createTopic",
      reason: "当前无待复习任务",
    };
  }

  return {
    type: "CHECK_PROGRESS",
    title: "首页状态暂不可用，但关键入口仍可继续使用",
    description: "你可以先新建知识点，或稍后返回首页刷新最新学习状态。",
    suggestedActionKey: "createTopic",
    reason: "首页聚合数据暂不可用",
  };
}

async function buildReviewStatus(userId: string): Promise<ReviewStatusSummary> {
  const now = new Date();

  try {
    const userObjectId = new Types.ObjectId(userId);
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const [pendingCount, overdueCount, completedToday, latestTask] = await Promise.all([
      ReviewTaskModel.countDocuments({
        userId: userObjectId,
        status: "pending",
      }),
      ReviewTaskModel.countDocuments({
        userId: userObjectId,
        status: "pending",
        dueAt: { $lt: now },
      }),
      ReviewTaskModel.countDocuments({
        userId: userObjectId,
        status: "completed",
        completedAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }),
      ReviewTaskModel.findOne({ userId: userObjectId })
        .sort({ updatedAt: -1 })
        .select("updatedAt"),
    ]);

    let statusKind: ReviewStatusKind = "EMPTY";
    if (overdueCount > 0) {
      statusKind = "OVERDUE";
    } else if (pendingCount > 0) {
      statusKind = "PENDING";
    }

    return {
      statusKind,
      pendingCount,
      overdueCount,
      completedToday,
      todayTarget: Math.max(pendingCount + completedToday, completedToday),
      lastUpdatedAt: latestTask?.updatedAt,
    };
  } catch (error) {
    logger.error(
      {
        err: error,
        userId,
      },
      "failed to build home dashboard review status",
    );

    return buildFallbackReviewStatus();
  }
}

export async function getHomeDashboard(userId: string): Promise<HomeDashboard> {
  const user = await UserModel.findOne({ _id: userId }).select("nickname");
  if (!user) {
    throw new AppError("用户不存在", 404);
  }

  const reviewStatus = await buildReviewStatus(userId);

  return {
    generatedAt: new Date(),
    reviewStatus,
    primaryActions: buildPrimaryActions(reviewStatus),
    guidance: buildGuidance(reviewStatus, user.nickname),
  };
}

export async function recordHomeActionEvent(
  userId: string,
  input: RecordHomeActionEventInput,
  meta: RequestMeta,
) {
  const user = await UserModel.exists({ _id: userId });
  if (!user) {
    throw new AppError("用户不存在", 404);
  }

  try {
    await HomeActionEventModel.create({
      userId: new Types.ObjectId(userId),
      actionKey: input.actionKey,
      targetModule: input.targetModule,
      guidanceType: input.guidanceType ?? null,
      result: input.result,
      deviceInfo: input.deviceInfo ?? meta.deviceInfo ?? null,
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        userId,
        actionKey: input.actionKey,
        targetModule: input.targetModule,
        result: input.result,
      },
      "failed to record home action event",
    );
    throw new AppError("首页行为记录失败", 500);
  }
}