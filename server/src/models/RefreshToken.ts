import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  Types,
} from "mongoose";

export interface RefreshTokenDocument extends Document {
  userId: Types.ObjectId;
  token: string;
  deviceInfo?: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    deviceInfo: {
      type: String,
      default: null,
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

const RefreshTokenModel =
  (models.RefreshToken as Model<RefreshTokenDocument>) ||
  model<RefreshTokenDocument>("RefreshToken", refreshTokenSchema);

export default RefreshTokenModel;
