import mongoose, { Types } from "mongoose";

import KnowledgePointModel, {
  type KnowledgePointDocument,
} from "../models/KnowledgePoint.js";
import ReviewNodeModel from "../models/ReviewNode.js";
import UserModel from "../models/User.js";
import type { RequestMeta } from "../utils/requestMeta.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/response.js";
import {
  parseTopicTitle,
  resolveStandardAnswer,
  type ResolvedStandardAnswer,
} from "./answerService.js";
import {
  createInitialReviewNodes,
  toReviewPlanSummary,
  type ReviewPlanSummary,
} from "./reviewPlanService.js";

export interface ExistingKnowledgePointPreview {
  id: string;
  title: string;
  canonicalTitle: string;
  firstReviewAt: string;
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

function isMongoDuplicateKeyError(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: number }).code === 11000,
  );
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

function toExistingKnowledgePointPreview(
  knowledgePoint: Pick<
    KnowledgePointDocument,
    "_id" | "title" | "canonicalTitle" | "firstReviewAt"
  >,
): ExistingKnowledgePointPreview {
  return {
    id: knowledgePoint._id.toString(),
    title: knowledgePoint.title,
    canonicalTitle: knowledgePoint.canonicalTitle,
    firstReviewAt: knowledgePoint.firstReviewAt.toISOString(),
  };
}

async function findExistingKnowledgePoint(
  userId: Types.ObjectId,
  condition: Record<string, unknown>,
) {
  return KnowledgePointModel.findOne({ userId, ...condition }).select(
    "title canonicalTitle firstReviewAt",
  );
}

function buildSuccessPayload(
  knowledgePoint: KnowledgePointDocument,
  standardAnswer: ResolvedStandardAnswer,
  reviewPlan: ReviewPlanSummary,
): TopicCreationResult {
  return {
    knowledgePoint: {
      id: knowledgePoint._id.toString(),
      title: knowledgePoint.title,
      canonicalTitle: knowledgePoint.canonicalTitle,
      createdAt: knowledgePoint.createdAt.toISOString(),
      firstReviewAt: knowledgePoint.firstReviewAt.toISOString(),
    },
    standardAnswer: {
      id: standardAnswer.sharedAnswerId,
      canonicalTitle: standardAnswer.canonicalTitle,
      content: standardAnswer.answerContent,
      source: standardAnswer.answerSource,
    },
    reviewPlan,
  };
}

async function persistTopicWithTransaction(input: {
  userId: Types.ObjectId;
  title: string;
  normalizedTitle: string;
  standardAnswer: ResolvedStandardAnswer;
}) {
  const session = await mongoose.startSession();

  try {
    let payload: TopicCreationResult | null = null;

    await session.withTransaction(async () => {
      const [knowledgePoint] = await KnowledgePointModel.create(
        [
          {
            userId: input.userId,
            title: input.title,
            normalizedTitle: input.normalizedTitle,
            canonicalTitle: input.standardAnswer.canonicalTitle,
            sharedAnswerId: new Types.ObjectId(
              input.standardAnswer.sharedAnswerId,
            ),
            source: "manualEntry",
            firstReviewAt: new Date(),
          },
        ],
        { session },
      );

      const reviewNodes = await createInitialReviewNodes({
        userId: input.userId,
        knowledgePointId: knowledgePoint._id,
        baseDate: knowledgePoint.createdAt,
        session,
      });

      knowledgePoint.firstReviewAt = reviewNodes[0]!.dueAt;
      await knowledgePoint.save({ session });

      payload = buildSuccessPayload(
        knowledgePoint,
        input.standardAnswer,
        toReviewPlanSummary(reviewNodes),
      );
    });

    if (!payload) {
      throw new AppError("复习计划初始化失败，请稍后重试", 500);
    }

    return payload;
  } finally {
    await session.endSession();
  }
}

async function persistTopicWithoutTransaction(input: {
  userId: Types.ObjectId;
  title: string;
  normalizedTitle: string;
  standardAnswer: ResolvedStandardAnswer;
}) {
  const knowledgePoint = await KnowledgePointModel.create({
    userId: input.userId,
    title: input.title,
    normalizedTitle: input.normalizedTitle,
    canonicalTitle: input.standardAnswer.canonicalTitle,
    sharedAnswerId: new Types.ObjectId(input.standardAnswer.sharedAnswerId),
    source: "manualEntry",
    firstReviewAt: new Date(),
  });

  try {
    const reviewNodes = await createInitialReviewNodes({
      userId: input.userId,
      knowledgePointId: knowledgePoint._id,
      baseDate: knowledgePoint.createdAt,
    });

    knowledgePoint.firstReviewAt = reviewNodes[0]!.dueAt;
    await knowledgePoint.save();

    return buildSuccessPayload(
      knowledgePoint,
      input.standardAnswer,
      toReviewPlanSummary(reviewNodes),
    );
  } catch (error) {
    await ReviewNodeModel.deleteMany({ knowledgePointId: knowledgePoint._id });
    await KnowledgePointModel.deleteOne({ _id: knowledgePoint._id });
    throw error;
  }
}

async function persistTopic(input: {
  userId: Types.ObjectId;
  title: string;
  normalizedTitle: string;
  standardAnswer: ResolvedStandardAnswer;
}) {
  try {
    return await persistTopicWithTransaction(input);
  } catch (error) {
    if (!isTransactionUnavailableError(error)) {
      throw error;
    }

    logger.warn(
      {
        canonicalTitle: input.standardAnswer.canonicalTitle,
      },
      "mongodb transaction unavailable, falling back to manual rollback",
    );

    return persistTopicWithoutTransaction(input);
  }
}

async function buildConflictError(
  userId: Types.ObjectId,
  condition: Record<string, unknown>,
) {
  const existingKnowledgePoint = await findExistingKnowledgePoint(
    userId,
    condition,
  );

  throw new AppError("已存在相同或相近知识点", 409, {
    existingKnowledgePoint: existingKnowledgePoint
      ? toExistingKnowledgePointPreview(existingKnowledgePoint)
      : null,
  });
}

export async function createTopicForUser(
  userId: string,
  title: unknown,
  meta?: RequestMeta,
) {
  const startedAt = Date.now();
  const userObjectId = new Types.ObjectId(userId);
  const userExists = await UserModel.exists({ _id: userObjectId });

  if (!userExists) {
    throw new AppError("用户不存在", 404);
  }

  const parsedTitle = parseTopicTitle(title);
  const duplicateByNormalized = await findExistingKnowledgePoint(userObjectId, {
    normalizedTitle: parsedTitle.normalizedTitle,
  });

  if (duplicateByNormalized) {
    logger.info(
      {
        userId,
        normalizedTitle: parsedTitle.normalizedTitle,
        duplicateStage: "normalizedTitle",
      },
      "topic creation blocked by duplicate knowledge point",
    );

    throw new AppError("已存在相同或相近知识点", 409, {
      existingKnowledgePoint: toExistingKnowledgePointPreview(
        duplicateByNormalized,
      ),
    });
  }

  const standardAnswer = await resolveStandardAnswer(
    parsedTitle.sanitizedTitle,
    parsedTitle.normalizedTitle,
  );

  const duplicateByCanonical = await findExistingKnowledgePoint(userObjectId, {
    canonicalTitle: standardAnswer.canonicalTitle,
  });

  if (duplicateByCanonical) {
    logger.info(
      {
        userId,
        canonicalTitle: standardAnswer.canonicalTitle,
        duplicateStage: "canonicalTitle",
      },
      "topic creation blocked by canonical duplicate knowledge point",
    );

    throw new AppError("已存在相同或相近知识点", 409, {
      existingKnowledgePoint:
        toExistingKnowledgePointPreview(duplicateByCanonical),
    });
  }

  try {
    const result = await persistTopic({
      userId: userObjectId,
      title: parsedTitle.sanitizedTitle,
      normalizedTitle: parsedTitle.normalizedTitle,
      standardAnswer,
    });

    logger.info(
      {
        userId,
        canonicalTitle: standardAnswer.canonicalTitle,
        answerSource: standardAnswer.answerSource,
        answerDurationMs: standardAnswer.durationMs,
        totalDurationMs: Date.now() - startedAt,
        ip: meta?.ip,
      },
      "topic created successfully",
    );

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isMongoDuplicateKeyError(error)) {
      await buildConflictError(userObjectId, {
        $or: [
          { normalizedTitle: parsedTitle.normalizedTitle },
          { canonicalTitle: standardAnswer.canonicalTitle },
        ],
      });
    }

    logger.error(
      {
        err: error,
        userId,
        normalizedTitle: parsedTitle.normalizedTitle,
        canonicalTitle: standardAnswer.canonicalTitle,
        answerSource: standardAnswer.answerSource,
        totalDurationMs: Date.now() - startedAt,
        ip: meta?.ip,
      },
      "topic creation failed",
    );

    throw new AppError("复习计划初始化失败，请稍后重试", 500);
  }
}

export default createTopicForUser;
