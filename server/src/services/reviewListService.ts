import { Types } from "mongoose";

import KnowledgePointModel from "../models/KnowledgePoint.js";
import ReviewNodeModel, {
  type ReviewNodeDocument,
} from "../models/ReviewNode.js";
import {
  getNextReminderAt,
  getReminderPolicySummary,
} from "./reminderPolicyService.js";
import { classifyOverdueLevel } from "./reviewPlanningService.js";

export type ReviewListTab = "pending" | "overdue" | "all";

export interface ReviewTaskListItem {
  taskId: string;
  knowledgePointId: string;
  knowledgePointTitle: string;
  status: "pending" | "overdue";
  overdueLevel?: "short" | "medium" | "long";
  dueAt: string;
  isPinned: boolean;
  overdueCountForKnowledgePoint: number;
  nextReminderAt?: string;
  routeTarget: string;
}

export interface ReviewListResult {
  summary: {
    pendingCount: number;
    overdueCount: number;
    allCount: number;
    showOverdueAlert: boolean;
    pinnedKnowledgePointIds: string[];
  };
  reminderPolicy: ReturnType<typeof getReminderPolicySummary>;
  tasks: ReviewTaskListItem[];
}

function sortTasks(left: ReviewTaskListItem, right: ReviewTaskListItem) {
  const overdueWeight = { long: 0, medium: 1, short: 2 } as const;

  if (left.isPinned !== right.isPinned) {
    return left.isPinned ? -1 : 1;
  }

  if (left.status !== right.status) {
    return left.status === "overdue" ? -1 : 1;
  }

  if (left.status === "overdue" && right.status === "overdue") {
    const leftWeight = overdueWeight[left.overdueLevel ?? "short"];
    const rightWeight = overdueWeight[right.overdueLevel ?? "short"];

    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }

    if (
      left.overdueCountForKnowledgePoint !== right.overdueCountForKnowledgePoint
    ) {
      return (
        right.overdueCountForKnowledgePoint - left.overdueCountForKnowledgePoint
      );
    }
  }

  return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
}

function toEffectiveNodeStatus(
  node: Pick<ReviewNodeDocument, "dueAt">,
  referenceDate: Date,
) {
  return node.dueAt.getTime() < referenceDate.getTime() ? "overdue" : "pending";
}

export async function getReviewListForUser(
  userId: string,
  tab: ReviewListTab,
): Promise<ReviewListResult> {
  const referenceDate = new Date();
  const userObjectId = new Types.ObjectId(userId);
  const nodes = await ReviewNodeModel.find({
    userId: userObjectId,
    status: { $ne: "completed" },
  }).sort({ knowledgePointId: 1, dueAt: 1, sequence: 1 });

  const firstNodesByKnowledgePoint = new Map<string, ReviewNodeDocument>();

  nodes.forEach((node) => {
    const key = node.knowledgePointId.toString();
    if (!firstNodesByKnowledgePoint.has(key)) {
      firstNodesByKnowledgePoint.set(key, node);
    }
  });

  const taskNodes = [...firstNodesByKnowledgePoint.values()];
  const knowledgePointIds = taskNodes.map((node) => node.knowledgePointId);
  const knowledgePoints = await KnowledgePointModel.find({
    _id: { $in: knowledgePointIds },
  }).select("title");
  const knowledgePointTitleMap = new Map(
    knowledgePoints.map((item) => [item._id.toString(), item.title]),
  );

  const historicalOverdueCounts = await ReviewNodeModel.aggregate<{
    _id: Types.ObjectId;
    overdueCount: number;
  }>([
    {
      $match: {
        userId: userObjectId,
        wasOverdue: true,
      },
    },
    {
      $group: {
        _id: "$knowledgePointId",
        overdueCount: { $sum: 1 },
      },
    },
  ]);
  const overdueCountMap = new Map(
    historicalOverdueCounts.map((item) => [
      item._id.toString(),
      item.overdueCount,
    ]),
  );

  const allTasks = taskNodes
    .map((node) => {
      const effectiveStatus = toEffectiveNodeStatus(node, referenceDate);
      const overdueLevel =
        classifyOverdueLevel(node.dueAt, referenceDate) ?? undefined;
      const knowledgePointId = node.knowledgePointId.toString();
      const overdueCountForKnowledgePoint =
        (overdueCountMap.get(knowledgePointId) ?? 0) +
        (effectiveStatus === "overdue" ? 1 : 0);
      const isPinned =
        effectiveStatus === "overdue" && overdueCountForKnowledgePoint >= 3;
      const nextReminderAt = getNextReminderAt(node, referenceDate);

      return {
        taskId: node._id.toString(),
        knowledgePointId,
        knowledgePointTitle:
          knowledgePointTitleMap.get(knowledgePointId) ?? "未命名知识点",
        status: effectiveStatus,
        overdueLevel,
        dueAt: node.dueAt.toISOString(),
        isPinned,
        overdueCountForKnowledgePoint,
        nextReminderAt: nextReminderAt?.toISOString(),
        routeTarget: `/pages/review-session/index?taskId=${node._id.toString()}`,
      } satisfies ReviewTaskListItem;
    })
    .sort(sortTasks);

  const tasks =
    tab === "all" ? allTasks : allTasks.filter((task) => task.status === tab);

  const pendingCount = allTasks.filter(
    (task) => task.status === "pending",
  ).length;
  const overdueCount = allTasks.filter(
    (task) => task.status === "overdue",
  ).length;
  const pinnedKnowledgePointIds = allTasks
    .filter((task) => task.isPinned)
    .map((task) => task.knowledgePointId);

  return {
    summary: {
      pendingCount,
      overdueCount,
      allCount: allTasks.length,
      showOverdueAlert: overdueCount > 10,
      pinnedKnowledgePointIds,
    },
    reminderPolicy: getReminderPolicySummary(),
    tasks,
  };
}

export default getReviewListForUser;
