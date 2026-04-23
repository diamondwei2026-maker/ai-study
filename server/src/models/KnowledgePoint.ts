import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  Types,
} from "mongoose";

export interface KnowledgePointDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  normalizedTitle: string;
  canonicalTitle: string;
  sharedAnswerId: Types.ObjectId;
  source: "manualEntry";
  firstReviewAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgePointSchema = new Schema<KnowledgePointDocument>(
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
    normalizedTitle: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    canonicalTitle: {
      type: String,
      required: true,
      trim: true,
    },
    sharedAnswerId: {
      type: Schema.Types.ObjectId,
      ref: "SharedStandardAnswer",
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["manualEntry"],
      default: "manualEntry",
      required: true,
    },
    firstReviewAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

knowledgePointSchema.index({ userId: 1, canonicalTitle: 1 }, { unique: true });
knowledgePointSchema.index({ userId: 1, normalizedTitle: 1 });

const KnowledgePointModel =
  (models.KnowledgePoint as Model<KnowledgePointDocument>) ||
  model<KnowledgePointDocument>("KnowledgePoint", knowledgePointSchema);

export default KnowledgePointModel;
