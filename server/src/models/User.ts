import mongoose, {
  Schema,
  model,
  type Document,
  type Model,
  Types,
} from "mongoose";

export type UserStatus = "active" | "locked";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  phone: string;
  nickname: string;
  avatar?: string | null;
  password?: string | null;
  status: UserStatus;
  loginFailCount: number;
  lockedUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nickname: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "locked"],
      default: "active",
    },
    loginFailCount: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const UserModel =
  (mongoose.models.User as Model<UserDocument>) ||
  model<UserDocument>("User", userSchema);

export default UserModel;
