import mongoose, { Schema, model, type Document, type Model } from "mongoose";

export type VerificationCodeType =
  | "register"
  | "login"
  | "resetPassword"
  | "changePhone";

export interface VerificationCodeDocument extends Document {
  phone: string;
  code: string;
  type: VerificationCodeType;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const verificationCodeSchema = new Schema<VerificationCodeDocument>(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["register", "login", "resetPassword", "changePhone"],
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: {
        expireAfterSeconds: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

const VerificationCodeModel =
  (mongoose.models.VerificationCode as Model<VerificationCodeDocument>) ||
  model<VerificationCodeDocument>("VerificationCode", verificationCodeSchema);

export default VerificationCodeModel;
