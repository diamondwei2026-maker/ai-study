import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  Types,
} from "mongoose";

export type ReviewTaskStatus = "pending" | "completed";

export interface ReviewTaskDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  dueAt: Date;
  status: ReviewTaskStatus;
  completedAt?: Date | null;
  overdueCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const reviewTaskSchema = new Schema<ReviewTaskDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    overdueCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

reviewTaskSchema.index({ userId: 1, status: 1, dueAt: 1 });

const ReviewTaskModel =
  (models.ReviewTask as Model<ReviewTaskDocument>) ||
  model<ReviewTaskDocument>("ReviewTask", reviewTaskSchema);

export default ReviewTaskModel;
