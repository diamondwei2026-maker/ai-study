import type { ClientSession, Types } from "mongoose";

import ReviewNodeModel, {
  type ReviewNodeDocument,
} from "../models/ReviewNode.js";
import { AppError } from "../utils/response.js";

export interface ReviewNodeTemplate {
  sequence: number;
  offsetCode: string;
  offsetMinutes: number;
  label: string;
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

export const REVIEW_NODE_TEMPLATES: ReviewNodeTemplate[] = [
  { sequence: 1, offsetCode: "H1", offsetMinutes: 60, label: "1小时后" },
  { sequence: 2, offsetCode: "D1", offsetMinutes: 1440, label: "第1天" },
  { sequence: 3, offsetCode: "D3", offsetMinutes: 4320, label: "第3天" },
  { sequence: 4, offsetCode: "D7", offsetMinutes: 10080, label: "第7天" },
  { sequence: 5, offsetCode: "D15", offsetMinutes: 21600, label: "第15天" },
  { sequence: 6, offsetCode: "D30", offsetMinutes: 43200, label: "第30天" },
];

function assertStrictlyIncreasing(nodes: Array<{ dueAt: Date }>) {
  for (let index = 1; index < nodes.length; index += 1) {
    if (nodes[index]!.dueAt.getTime() <= nodes[index - 1]!.dueAt.getTime()) {
      throw new AppError("复习计划初始化失败，请稍后重试", 500);
    }
  }
}

export function buildInitialReviewNodeDrafts(baseDate: Date) {
  const drafts = REVIEW_NODE_TEMPLATES.map((template) => ({
    ...template,
    dueAt: new Date(baseDate.getTime() + template.offsetMinutes * 60 * 1000),
  }));

  assertStrictlyIncreasing(drafts);
  return drafts;
}

export async function createInitialReviewNodes(input: {
  userId: Types.ObjectId;
  knowledgePointId: Types.ObjectId;
  baseDate: Date;
  session?: ClientSession | null;
}) {
  const drafts = buildInitialReviewNodeDrafts(input.baseDate).map((draft) => ({
    userId: input.userId,
    knowledgePointId: input.knowledgePointId,
    sequence: draft.sequence,
    offsetCode: draft.offsetCode,
    offsetMinutes: draft.offsetMinutes,
    nodeType: "initial" as const,
    sourceNodeId: null,
    dueAt: draft.dueAt,
    status: "pending" as const,
    overdueLevel: null,
    overdueAt: null,
    wasOverdue: false,
    overdueReminderSentCount: 0,
    completedAt: null,
    nextDueAt: null,
  }));

  const nodes = await ReviewNodeModel.create(drafts, {
    session: input.session ?? undefined,
  });

  if (nodes.length !== REVIEW_NODE_TEMPLATES.length) {
    throw new AppError("复习计划初始化失败，请稍后重试", 500);
  }

  return nodes;
}

export function toReviewPlanSummary(
  nodes: ReviewNodeDocument[],
): ReviewPlanSummary {
  const orderedNodes = [...nodes].sort(
    (left, right) => left.sequence - right.sequence,
  );

  return {
    totalNodes: orderedNodes.length,
    nextDueAt: orderedNodes[0]!.dueAt.toISOString(),
    nodes: orderedNodes.map((node) => ({
      sequence: node.sequence,
      label:
        REVIEW_NODE_TEMPLATES.find(
          (template) => template.sequence === node.sequence,
        )?.label ?? `第${node.sequence}个节点`,
      dueAt: node.dueAt.toISOString(),
    })),
  };
}

export default createInitialReviewNodes;
