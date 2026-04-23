import mongoose, {
  Schema,
  model,
  type Document,
  type Model,
  Types,
} from "mongoose";

import type { ReviewOverdueLevel } from "./ReviewNode.js";

export type ReviewJudgment = "MASTERED" | "FUZZY" | "UNMASTERED";
export type ReviewAttemptResultStatus = "applied" | "failed";

export interface ReviewAttemptDocument extends Document {
  _id: Types.ObjectId;
  reviewNodeId: Types.ObjectId;
  userId: Types.ObjectId;
  knowledgePointId: Types.ObjectId;
  submissionText: string;
  submittedAt: Date;
  judgment: ReviewJudgment;
  judgmentReason: string;
  overdueLevelAtSubmission?: ReviewOverdueLevel | null;
  adjustmentKey: string;
  nextDueAt: Date;
  createdFollowUpNodeIds: Types.ObjectId[];
  resultStatus: ReviewAttemptResultStatus;
  createdAt: Date;
  updatedAt: Date;
}

const reviewAttemptSchema = new Schema<ReviewAttemptDocument>(
  {
    reviewNodeId: {
      type: Schema.Types.ObjectId,
      ref: "ReviewNode",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    knowledgePointId: {
      type: Schema.Types.ObjectId,
      ref: "KnowledgePoint",
      required: true,
      index: true,
    },
    submissionText: {
      type: String,
      required: true,
      trim: true,
    },
    submittedAt: {
      type: Date,
      required: true,
      index: true,
    },
    judgment: {
      type: String,
      enum: ["MASTERED", "FUZZY", "UNMASTERED"],
      required: true,
      index: true,
    },
    judgmentReason: {
      type: String,
      required: true,
      trim: true,
    },
    overdueLevelAtSubmission: {
      type: String,
      enum: ["short", "medium", "long"],
      default: null,
    },
    adjustmentKey: {
      type: String,
      required: true,
      trim: true,
    },
    nextDueAt: {
      type: Date,
      required: true,
      index: true,
    },
    createdFollowUpNodeIds: {
      type: [Schema.Types.ObjectId],
      default: [],
      required: true,
    },
    resultStatus: {
      type: String,
      enum: ["applied", "failed"],
      required: true,
      default: "applied",
    },
  },
  {
    timestamps: true,
  },
);

reviewAttemptSchema.index({ userId: 1, knowledgePointId: 1, submittedAt: -1 });

const ReviewAttemptModel =
  (mongoose.models.ReviewAttempt as Model<ReviewAttemptDocument>) ||
  model<ReviewAttemptDocument>("ReviewAttempt", reviewAttemptSchema);

export default ReviewAttemptModel;
