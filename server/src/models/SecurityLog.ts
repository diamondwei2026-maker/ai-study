import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  Types,
} from "mongoose";

export interface SecurityLogDocument extends Document {
  userId?: Types.ObjectId | null;
  action: string;
  result: "success" | "failure";
  ip?: string | null;
  deviceInfo?: string | null;
  detail?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const securityLogSchema = new Schema<SecurityLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    result: {
      type: String,
      enum: ["success", "failure"],
      required: true,
    },
    ip: {
      type: String,
      default: null,
    },
    deviceInfo: {
      type: String,
      default: null,
    },
    detail: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

securityLogSchema.index({ createdAt: -1 });

const SecurityLogModel =
  (models.SecurityLog as Model<SecurityLogDocument>) ||
  model<SecurityLogDocument>("SecurityLog", securityLogSchema);

export default SecurityLogModel;
