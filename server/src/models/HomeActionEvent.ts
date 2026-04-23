import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  Types,
} from "mongoose";

export type HomeActionKey = "createTopic" | "startReview" | "guidanceAction";
export type HomeActionResult = "success" | "blocked" | "failed";
export type HomeGuidanceType =
  | "CREATE_FIRST"
  | "REVIEW_NOW"
  | "KEEP_MOMENTUM"
  | "CHECK_PROGRESS";

export interface HomeActionEventDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  actionKey: HomeActionKey;
  targetModule: string;
  guidanceType?: HomeGuidanceType | null;
  result: HomeActionResult;
  deviceInfo?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const homeActionEventSchema = new Schema<HomeActionEventDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actionKey: {
      type: String,
      enum: ["createTopic", "startReview", "guidanceAction"],
      required: true,
      index: true,
    },
    targetModule: {
      type: String,
      required: true,
      trim: true,
    },
    guidanceType: {
      type: String,
      enum: ["CREATE_FIRST", "REVIEW_NOW", "KEEP_MOMENTUM", "CHECK_PROGRESS"],
      default: null,
    },
    result: {
      type: String,
      enum: ["success", "blocked", "failed"],
      required: true,
    },
    deviceInfo: {
      type: String,
      default: null,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  },
);

homeActionEventSchema.index({ userId: 1, createdAt: -1 });

const HomeActionEventModel =
  (models.HomeActionEvent as Model<HomeActionEventDocument>) ||
  model<HomeActionEventDocument>("HomeActionEvent", homeActionEventSchema);

export default HomeActionEventModel;