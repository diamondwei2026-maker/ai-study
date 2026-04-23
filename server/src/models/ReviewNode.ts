import mongoose, {
  Schema,
  model,
  type Document,
  type Model,
  Types,
} from "mongoose";

export type ReviewNodeStatus = "pending" | "completed" | "overdue";
export type ReviewNodeType = "initial" | "reinforcement" | "continuation";
export type ReviewOverdueLevel = "short" | "medium" | "long";

export interface ReviewNodeDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  knowledgePointId: Types.ObjectId;
  sequence: number;
  offsetCode: string;
  offsetMinutes: number;
  nodeType: ReviewNodeType;
  sourceNodeId?: Types.ObjectId | null;
  dueAt: Date;
  status: ReviewNodeStatus;
  overdueLevel?: ReviewOverdueLevel | null;
  overdueAt?: Date | null;
  wasOverdue: boolean;
  overdueReminderSentCount: number;
  completedAt?: Date | null;
  nextDueAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reviewNodeSchema = new Schema<ReviewNodeDocument>(
  {
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
    sequence: {
      type: Number,
      required: true,
      min: 1,
    },
    offsetCode: {
      type: String,
      required: true,
      trim: true,
    },
    offsetMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    nodeType: {
      type: String,
      enum: ["initial", "reinforcement", "continuation"],
      required: true,
      default: "initial",
    },
    sourceNodeId: {
      type: Schema.Types.ObjectId,
      ref: "ReviewNode",
      default: null,
      index: true,
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "overdue"],
      required: true,
      default: "pending",
    },
    overdueLevel: {
      type: String,
      enum: ["short", "medium", "long"],
      default: null,
    },
    overdueAt: {
      type: Date,
      default: null,
    },
    wasOverdue: {
      type: Boolean,
      required: true,
      default: false,
    },
    overdueReminderSentCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 2,
    },
    completedAt: {
      type: Date,
      default: null,
      index: true,
    },
    nextDueAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

reviewNodeSchema.index({ knowledgePointId: 1, sequence: 1 }, { unique: true });
reviewNodeSchema.index({ userId: 1, knowledgePointId: 1, dueAt: 1 });
reviewNodeSchema.index({ userId: 1, status: 1, dueAt: 1 });

const ReviewNodeModel =
  (mongoose.models.ReviewNode as Model<ReviewNodeDocument>) ||
  model<ReviewNodeDocument>("ReviewNode", reviewNodeSchema);

export default ReviewNodeModel;
