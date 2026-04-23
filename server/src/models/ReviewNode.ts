import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  Types,
} from "mongoose";

export type ReviewNodeStatus = "pending" | "completed" | "overdue";

export interface ReviewNodeDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  knowledgePointId: Types.ObjectId;
  sequence: number;
  offsetCode: string;
  offsetMinutes: number;
  dueAt: Date;
  status: ReviewNodeStatus;
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
      max: 6,
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
  },
  {
    timestamps: true,
  },
);

reviewNodeSchema.index({ knowledgePointId: 1, sequence: 1 }, { unique: true });
reviewNodeSchema.index({ userId: 1, knowledgePointId: 1, dueAt: 1 });

const ReviewNodeModel =
  (models.ReviewNode as Model<ReviewNodeDocument>) ||
  model<ReviewNodeDocument>("ReviewNode", reviewNodeSchema);

export default ReviewNodeModel;
