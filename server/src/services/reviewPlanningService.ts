import type { Types } from "mongoose";

import type { ReviewJudgment } from "../models/ReviewAttempt.js";
import type {
  ReviewNodeDocument,
  ReviewNodeType,
  ReviewOverdueLevel,
} from "../models/ReviewNode.js";
import { REVIEW_NODE_TEMPLATES } from "./reviewPlanService.js";

export interface ReviewFollowUpDraft {
  sequence?: number;
  offsetCode: string;
  offsetMinutes: number;
  nodeType: ReviewNodeType;
  sourceNodeId?: Types.ObjectId | null;
  dueAt: Date;
}

export interface ReviewAdjustmentPlan {
  adjustmentKey: string;
  overdueLevel: ReviewOverdueLevel | null;
  followUpDrafts: ReviewFollowUpDraft[];
  nextDueAt: Date;
}

const SHORT_OVERDUE_MS = 24 * 60 * 60 * 1000;
const MEDIUM_OVERDUE_MS = 7 * 24 * 60 * 60 * 1000;
const REINFORCEMENT_OFFSET_MINUTES = 24 * 60;
const CONTINUATION_OFFSET_MINUTES = 30 * 24 * 60;

function addMinutes(baseDate: Date, offsetMinutes: number) {
  return new Date(baseDate.getTime() + offsetMinutes * 60 * 1000);
}

function resolveCurrentStageIndex(
  node: Pick<ReviewNodeDocument, "offsetCode" | "nodeType">,
) {
  if (node.nodeType === "continuation") {
    return REVIEW_NODE_TEMPLATES.length;
  }

  const templateIndex = REVIEW_NODE_TEMPLATES.findIndex(
    (template) => template.offsetCode === node.offsetCode,
  );

  return templateIndex === -1 ? 0 : templateIndex;
}

function buildMainSchedule(startIndex: number, completedAt: Date) {
  if (startIndex >= REVIEW_NODE_TEMPLATES.length) {
    return [
      {
        offsetCode: "C30",
        offsetMinutes: CONTINUATION_OFFSET_MINUTES,
        nodeType: "continuation" as const,
        sourceNodeId: null,
        dueAt: addMinutes(completedAt, CONTINUATION_OFFSET_MINUTES),
      },
    ];
  }

  return REVIEW_NODE_TEMPLATES.slice(startIndex).map((template) => ({
    offsetCode: template.offsetCode,
    offsetMinutes: template.offsetMinutes,
    nodeType: "initial" as const,
    sourceNodeId: null,
    dueAt: addMinutes(completedAt, template.offsetMinutes),
  }));
}

function buildAdjustmentKey(
  overdueLevel: ReviewOverdueLevel | null,
  judgment: ReviewJudgment,
  strategy: "ADVANCE" | "KEEP" | "ROLLBACK" | "RESET",
  reinforced: boolean,
) {
  const scope = overdueLevel
    ? `${overdueLevel.toUpperCase()}_OVERDUE`
    : "ON_TIME";
  return [scope, judgment, strategy, reinforced ? "REINFORCE" : null]
    .filter(Boolean)
    .join("_");
}

export function classifyOverdueLevel(
  dueAt: Date,
  referenceDate = new Date(),
): ReviewOverdueLevel | null {
  const delayMs = referenceDate.getTime() - dueAt.getTime();

  if (delayMs <= 0) {
    return null;
  }

  if (delayMs <= SHORT_OVERDUE_MS) {
    return "short";
  }

  if (delayMs <= MEDIUM_OVERDUE_MS) {
    return "medium";
  }

  return "long";
}

export function describeOverdueLevel(level: ReviewOverdueLevel | null) {
  if (level === "short") {
    return "已过期 24 小时内。记忆仍有残留，尽快完成本次复习。";
  }

  if (level === "medium") {
    return "已过期 24 小时到 7 天。建议优先补做并适度回退复习计划。";
  }

  if (level === "long") {
    return "已过期超过 7 天。建议按最早计划节点重新建立记忆。";
  }

  return "按当前节奏完成本次费曼复习即可。";
}

export function describePlanLabel(
  node: Pick<ReviewNodeDocument, "nodeType" | "offsetCode">,
) {
  if (node.nodeType === "reinforcement") {
    return "短期补强 · 24 小时后";
  }

  if (node.nodeType === "continuation") {
    return "延展复习 · 30 天后";
  }

  const index = REVIEW_NODE_TEMPLATES.findIndex(
    (template) => template.offsetCode === node.offsetCode,
  );
  const label = REVIEW_NODE_TEMPLATES.find(
    (template) => template.offsetCode === node.offsetCode,
  )?.label;

  return index === -1 ? "计划复习节点" : `第${index + 1}次复习 · ${label}`;
}

export function buildReviewAdjustmentPlan(input: {
  currentNode: Pick<
    ReviewNodeDocument,
    "_id" | "dueAt" | "offsetCode" | "nodeType"
  >;
  completedAt: Date;
  judgment: ReviewJudgment;
}) {
  const overdueLevel = classifyOverdueLevel(
    input.currentNode.dueAt,
    input.completedAt,
  );
  const currentStageIndex = resolveCurrentStageIndex(input.currentNode);

  let targetIndex = currentStageIndex + 1;
  let reinforced = false;
  let strategy: "ADVANCE" | "KEEP" | "ROLLBACK" | "RESET" = "ADVANCE";

  if (!overdueLevel) {
    if (input.judgment === "FUZZY") {
      reinforced = true;
    }

    if (input.judgment === "UNMASTERED") {
      strategy = "RESET";
      targetIndex = 0;
    }
  } else if (overdueLevel === "short") {
    if (input.judgment === "MASTERED") {
      strategy = "KEEP";
      targetIndex = currentStageIndex;
      reinforced = true;
    } else if (input.judgment === "FUZZY") {
      strategy = "ROLLBACK";
      targetIndex = Math.max(0, currentStageIndex - 1);
      reinforced = true;
    } else {
      strategy = "RESET";
      targetIndex = 0;
    }
  } else if (overdueLevel === "medium") {
    if (input.judgment === "MASTERED") {
      strategy = "ROLLBACK";
      targetIndex = Math.max(0, currentStageIndex - 1);
      reinforced = true;
    } else if (input.judgment === "FUZZY") {
      strategy = "ROLLBACK";
      targetIndex = Math.max(0, currentStageIndex - 2);
      reinforced = true;
    } else {
      strategy = "RESET";
      targetIndex = 0;
    }
  } else {
    strategy = "RESET";
    targetIndex = 0;
  }

  const followUpDrafts = [
    ...(reinforced
      ? [
          {
            offsetCode: "R24H",
            offsetMinutes: REINFORCEMENT_OFFSET_MINUTES,
            nodeType: "reinforcement" as const,
            sourceNodeId: input.currentNode._id,
            dueAt: addMinutes(input.completedAt, REINFORCEMENT_OFFSET_MINUTES),
          },
        ]
      : []),
    ...buildMainSchedule(targetIndex, input.completedAt),
  ];

  return {
    adjustmentKey: buildAdjustmentKey(
      overdueLevel,
      input.judgment,
      strategy,
      reinforced,
    ),
    overdueLevel,
    followUpDrafts,
    nextDueAt: followUpDrafts[0]!.dueAt,
  } satisfies ReviewAdjustmentPlan;
}

export default buildReviewAdjustmentPlan;
