import mongoose, { Types, type ClientSession } from "mongoose";

import KnowledgePointModel from "../models/KnowledgePoint.js";
import ReviewAttemptModel from "../models/ReviewAttempt.js";
import ReviewNodeModel, {
  type ReviewNodeDocument,
} from "../models/ReviewNode.js";
import SharedStandardAnswerModel from "../models/SharedStandardAnswer.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/response.js";
import { evaluateReviewSubmission } from "./aiReviewService.js";
import {
  buildReviewAdjustmentPlan,
  classifyOverdueLevel,
  describeOverdueLevel,
  describePlanLabel,
  type ReviewFollowUpDraft,
} from "./reviewPlanningService.js";

export interface ReviewTaskDetailResult {
  task: {
    taskId: string;
    knowledgePointId: string;
    knowledgePointTitle: string;
    planLabel: string;
    status: "pending" | "overdue";
    overdueLevel?: "short" | "medium" | "long";
    dueAt: string;
    overdueDescription: string;
  };
  feynmanPrompt: {
    title: string;
    description: string;
    minRecommendedChars: number;
    pureTextOnly: true;
  };
}

export interface ReviewSubmitResult {
  attemptId: string;
  result: {
    judgment: "MASTERED" | "FUZZY" | "UNMASTERED";
    reason: string;
    planAdjustmentKey: string;
  };
  taskUpdate: {
    status: "completed";
    completedAt: string;
    nextDueAt: string;
  };
  followUpNodes: Array<{
    nodeType: "initial" | "reinforcement" | "continuation";
    dueAt: string;
  }>;
  redirectTarget: string;
}

function isTransactionUnavailableError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  return /transaction numbers are only allowed|replica set member|mongos/i.test(
    message,
  );
}

async function loadTaskContext(userId: string, taskId: string) {
  if (!Types.ObjectId.isValid(taskId)) {
    throw new AppError("复习任务不存在或已失效", 404);
  }

  const reviewNode = await ReviewNodeModel.findOne({
    _id: new Types.ObjectId(taskId),
    userId: new Types.ObjectId(userId),
  });

  if (!reviewNode) {
    throw new AppError("复习任务不存在或已失效", 404);
  }

  const knowledgePoint = await KnowledgePointModel.findById(
    reviewNode.knowledgePointId,
  );
  if (!knowledgePoint) {
    throw new AppError("复习任务不存在或已失效", 404);
  }

  const standardAnswer = await SharedStandardAnswerModel.findById(
    knowledgePoint.sharedAnswerId,
  );

  if (!standardAnswer) {
    throw new AppError("复习任务不存在或已失效", 404);
  }

  return {
    reviewNode,
    knowledgePoint,
    standardAnswer,
  };
}

function toEffectiveStatus(
  node: Pick<ReviewNodeDocument, "status" | "dueAt">,
  referenceDate: Date,
) {
  if (node.status === "completed") {
    return "completed" as const;
  }

  return node.dueAt.getTime() < referenceDate.getTime() ? "overdue" : "pending";
}

function assertTaskSubmittable(
  node: Pick<ReviewNodeDocument, "status" | "dueAt">,
  referenceDate: Date,
) {
  const effectiveStatus = toEffectiveStatus(node, referenceDate);

  if (effectiveStatus === "completed") {
    throw new AppError("该复习任务状态已变化，请返回列表刷新后重试", 409);
  }

  return effectiveStatus;
}

function extendFollowUpDrafts(
  baseDrafts: ReviewFollowUpDraft[],
  targetLength: number,
) {
  if (baseDrafts.length >= targetLength) {
    return [...baseDrafts];
  }

  const drafts = [...baseDrafts];
  let lastDueAt = drafts[drafts.length - 1]!.dueAt;

  while (drafts.length < targetLength) {
    lastDueAt = new Date(lastDueAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    drafts.push({
      offsetCode: "C30",
      offsetMinutes: 30 * 24 * 60,
      nodeType: "continuation",
      sourceNodeId: null,
      dueAt: lastDueAt,
    });
  }

  return drafts;
}

async function applyReviewCompletionChanges(input: {
  userObjectId: Types.ObjectId;
  taskObjectId: Types.ObjectId;
  content: string;
  completedAt: Date;
  evaluation: Awaited<ReturnType<typeof evaluateReviewSubmission>>;
  plan: ReturnType<typeof buildReviewAdjustmentPlan>;
  session?: ClientSession | null;
}) {
  const currentNodeQuery = ReviewNodeModel.findOne({
    _id: input.taskObjectId,
    userId: input.userObjectId,
  });

  if (input.session) {
    currentNodeQuery.session(input.session);
  }

  const currentNode = await currentNodeQuery;

  if (!currentNode) {
    throw new AppError("复习任务不存在或已失效", 404);
  }

  assertTaskSubmittable(currentNode, input.completedAt);

  const futureNodesQuery = ReviewNodeModel.find({
    userId: input.userObjectId,
    knowledgePointId: currentNode.knowledgePointId,
    _id: { $ne: currentNode._id },
    status: { $ne: "completed" },
  }).sort({ dueAt: 1, sequence: 1 });

  if (input.session) {
    futureNodesQuery.session(input.session);
  }

  const futureNodes = await futureNodesQuery;
  const followUpDrafts = extendFollowUpDrafts(
    input.plan.followUpDrafts,
    Math.max(input.plan.followUpDrafts.length, futureNodes.length),
  );
  const followUpNodes: ReviewNodeDocument[] = [];
  const maxSequence = Math.max(
    currentNode.sequence,
    ...futureNodes.map((node) => node.sequence),
  );

  for (let index = 0; index < followUpDrafts.length; index += 1) {
    const draft = followUpDrafts[index]!;
    const existingNode = futureNodes[index];

    if (existingNode) {
      existingNode.offsetCode = draft.offsetCode;
      existingNode.offsetMinutes = draft.offsetMinutes;
      existingNode.nodeType = draft.nodeType;
      existingNode.sourceNodeId = draft.sourceNodeId ?? null;
      existingNode.dueAt = draft.dueAt;
      existingNode.status = "pending";
      existingNode.overdueLevel = null;
      existingNode.overdueAt = null;
      existingNode.nextDueAt = null;
      existingNode.completedAt = null;
      existingNode.overdueReminderSentCount = 0;
      await existingNode.save(
        input.session ? { session: input.session } : undefined,
      );
      followUpNodes.push(existingNode);
      continue;
    }

    const [createdNode] = await ReviewNodeModel.create(
      [
        {
          userId: input.userObjectId,
          knowledgePointId: currentNode.knowledgePointId,
          sequence: maxSequence + index + 1,
          offsetCode: draft.offsetCode,
          offsetMinutes: draft.offsetMinutes,
          nodeType: draft.nodeType,
          sourceNodeId: draft.sourceNodeId ?? null,
          dueAt: draft.dueAt,
          status: "pending",
          overdueLevel: null,
          overdueAt: null,
          wasOverdue: false,
          overdueReminderSentCount: 0,
          completedAt: null,
          nextDueAt: null,
        },
      ],
      input.session ? { session: input.session } : undefined,
    );

    followUpNodes.push(createdNode);
  }

  const overdueLevel = classifyOverdueLevel(
    currentNode.dueAt,
    input.completedAt,
  );
  currentNode.status = "completed";
  currentNode.completedAt = input.completedAt;
  currentNode.nextDueAt = input.plan.nextDueAt;
  currentNode.wasOverdue = currentNode.wasOverdue || overdueLevel !== null;
  currentNode.overdueLevel = overdueLevel;
  currentNode.overdueAt = overdueLevel
    ? (currentNode.overdueAt ?? currentNode.dueAt)
    : null;
  await currentNode.save(
    input.session ? { session: input.session } : undefined,
  );

  const [attempt] = await ReviewAttemptModel.create(
    [
      {
        reviewNodeId: currentNode._id,
        userId: input.userObjectId,
        knowledgePointId: currentNode.knowledgePointId,
        submissionText: input.content,
        submittedAt: input.completedAt,
        judgment: input.evaluation.judgment,
        judgmentReason: input.evaluation.reason,
        overdueLevelAtSubmission: overdueLevel,
        adjustmentKey: input.plan.adjustmentKey,
        nextDueAt: input.plan.nextDueAt,
        createdFollowUpNodeIds: followUpNodes.map((node) => node._id),
        resultStatus: "applied",
      },
    ],
    input.session ? { session: input.session } : undefined,
  );

  return {
    attemptId: attempt._id.toString(),
    result: {
      judgment: input.evaluation.judgment,
      reason: input.evaluation.reason,
      planAdjustmentKey: input.plan.adjustmentKey,
    },
    taskUpdate: {
      status: "completed" as const,
      completedAt: input.completedAt.toISOString(),
      nextDueAt: input.plan.nextDueAt.toISOString(),
    },
    followUpNodes: followUpNodes
      .slice(0, input.plan.followUpDrafts.length)
      .map((node) => ({
        nodeType: node.nodeType,
        dueAt: node.dueAt.toISOString(),
      })),
    redirectTarget: "/pages/review/index?tab=pending",
  } satisfies ReviewSubmitResult;
}

async function persistReviewCompletion(input: {
  userId: string;
  taskId: string;
  content: string;
}) {
  const completedAt = new Date();
  const taskContext = await loadTaskContext(input.userId, input.taskId);
  assertTaskSubmittable(taskContext.reviewNode, completedAt);

  const evaluation = await evaluateReviewSubmission({
    knowledgePointTitle: taskContext.knowledgePoint.title,
    standardAnswer: taskContext.standardAnswer.answerContent,
    submissionText: input.content,
  });

  const plan = buildReviewAdjustmentPlan({
    currentNode: taskContext.reviewNode,
    completedAt,
    judgment: evaluation.judgment,
  });

  const userObjectId = new Types.ObjectId(input.userId);
  const taskObjectId = new Types.ObjectId(input.taskId);

  const session = await mongoose.startSession();

  try {
    let payload: ReviewSubmitResult | null = null;

    await session.withTransaction(async () => {
      payload = await applyReviewCompletionChanges({
        userObjectId,
        taskObjectId,
        content: input.content,
        completedAt,
        evaluation,
        plan,
        session,
      });
    });

    if (!payload) {
      throw new AppError("服务器内部错误", 500);
    }

    return payload;
  } finally {
    await session.endSession();
  }
}

async function persistReviewCompletionWithoutTransaction(input: {
  userId: string;
  taskId: string;
  content: string;
}) {
  logger.warn(
    { taskId: input.taskId },
    "mongodb transaction unavailable, applying review completion without transaction",
  );

  const completedAt = new Date();
  const taskContext = await loadTaskContext(input.userId, input.taskId);
  assertTaskSubmittable(taskContext.reviewNode, completedAt);

  const evaluation = await evaluateReviewSubmission({
    knowledgePointTitle: taskContext.knowledgePoint.title,
    standardAnswer: taskContext.standardAnswer.answerContent,
    submissionText: input.content,
  });

  const plan = buildReviewAdjustmentPlan({
    currentNode: taskContext.reviewNode,
    completedAt,
    judgment: evaluation.judgment,
  });

  return applyReviewCompletionChanges({
    userObjectId: new Types.ObjectId(input.userId),
    taskObjectId: new Types.ObjectId(input.taskId),
    content: input.content,
    completedAt,
    evaluation,
    plan,
  });
}

export async function getReviewTaskDetailForUser(
  userId: string,
  taskId: string,
): Promise<ReviewTaskDetailResult> {
  const referenceDate = new Date();
  const { reviewNode, knowledgePoint } = await loadTaskContext(userId, taskId);
  const effectiveStatus = assertTaskSubmittable(reviewNode, referenceDate);
  const overdueLevel =
    classifyOverdueLevel(reviewNode.dueAt, referenceDate) ?? undefined;

  return {
    task: {
      taskId: reviewNode._id.toString(),
      knowledgePointId: knowledgePoint._id.toString(),
      knowledgePointTitle: knowledgePoint.title,
      planLabel: describePlanLabel(reviewNode),
      status: effectiveStatus,
      overdueLevel,
      dueAt: reviewNode.dueAt.toISOString(),
      overdueDescription: describeOverdueLevel(overdueLevel ?? null),
    },
    feynmanPrompt: {
      title: "费曼输出要求",
      description: "请用大白话解释该知识点的含义，讲给一个完全不懂的人听。",
      minRecommendedChars: 80,
      pureTextOnly: true,
    },
  };
}

export async function submitReviewTaskForUser(input: {
  userId: string;
  taskId: string;
  content: string;
}) {
  try {
    return await persistReviewCompletion(input);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isTransactionUnavailableError(error)) {
      return persistReviewCompletionWithoutTransaction(input);
    }

    logger.error(
      { err: error, taskId: input.taskId },
      "review submission failed",
    );
    throw new AppError("服务器内部错误", 500);
  }
}

export default submitReviewTaskForUser;
