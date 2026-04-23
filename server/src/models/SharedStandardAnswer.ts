import mongoose, {
  Schema,
  model,
  type Document,
  type Model,
  Types,
} from "mongoose";

export type SharedAnswerSource = "reused" | "generated";

export interface SharedStandardAnswerDocument extends Document {
  _id: Types.ObjectId;
  canonicalTitle: string;
  normalizedCanonicalTitle: string;
  aliases: string[];
  answerContent: string;
  answerSource: SharedAnswerSource;
  answerVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const sharedStandardAnswerSchema = new Schema<SharedStandardAnswerDocument>(
  {
    canonicalTitle: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    normalizedCanonicalTitle: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    aliases: {
      type: [String],
      required: true,
      default: [],
    },
    answerContent: {
      type: String,
      required: true,
      trim: true,
    },
    answerSource: {
      type: String,
      enum: ["reused", "generated"],
      required: true,
      default: "generated",
    },
    answerVersion: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

sharedStandardAnswerSchema.index({ aliases: 1 });

const SharedStandardAnswerModel =
  (mongoose.models
    .SharedStandardAnswer as Model<SharedStandardAnswerDocument>) ||
  model<SharedStandardAnswerDocument>(
    "SharedStandardAnswer",
    sharedStandardAnswerSchema,
  );

export default SharedStandardAnswerModel;
