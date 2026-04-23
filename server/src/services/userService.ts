import { Types } from "mongoose";

import SecurityLogModel from "../models/SecurityLog.js";
import UserModel from "../models/User.js";
import VerificationCodeModel from "../models/VerificationCode.js";
import type { ChangePhoneInput } from "./authService.js";
import type { RequestMeta } from "../utils/requestMeta.js";
import { AppError } from "../utils/response.js";

function maskPhone(phone: string) {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
}

async function writeSecurityLog(
  action: string,
  result: "success" | "failure",
  meta: RequestMeta,
  detail?: string,
  userId?: string,
) {
  await SecurityLogModel.create({
    userId: userId ? new Types.ObjectId(userId) : null,
    action,
    result,
    ip: meta.ip ?? null,
    deviceInfo: meta.deviceInfo ?? null,
    detail: detail ?? null,
  });
}

async function consumeChangePhoneCode(phone: string, code: string) {
  const verificationCode = await VerificationCodeModel.findOneAndUpdate(
    {
      phone,
      code,
      type: "changePhone",
      used: false,
      expiresAt: { $gt: new Date() },
    },
    {
      used: true,
    },
    {
      sort: { createdAt: -1 },
      returnDocument: "before",
    },
  );

  if (!verificationCode) {
    throw new AppError("验证码无效或已过期", 400);
  }
}

export async function getProfile(userId: string) {
  const user = await UserModel.findOne({ _id: userId });
  if (!user) {
    throw new AppError("用户不存在", 404);
  }

  return {
    id: user._id.toString(),
    phone: maskPhone(user.phone),
    nickname: user.nickname,
    avatar: user.avatar ?? null,
    createdAt: user.createdAt,
  };
}

export async function updateProfile(userId: string, nickname: string) {
  const user = await UserModel.findOneAndUpdate(
    { _id: userId },
    { nickname: nickname.trim() },
    { returnDocument: "after" },
  );

  if (!user) {
    throw new AppError("用户不存在", 404);
  }

  return {
    id: user._id.toString(),
    phone: maskPhone(user.phone),
    nickname: user.nickname,
    avatar: user.avatar ?? null,
  };
}

export async function uploadAvatar(userId: string, avatarPath: string) {
  const user = await UserModel.findOneAndUpdate(
    { _id: userId },
    { avatar: avatarPath },
    { returnDocument: "after" },
  );

  if (!user) {
    throw new AppError("用户不存在", 404);
  }

  return {
    id: user._id.toString(),
    phone: maskPhone(user.phone),
    nickname: user.nickname,
    avatar: user.avatar ?? null,
  };
}

export async function changePhone(
  userId: string,
  input: ChangePhoneInput,
  meta: RequestMeta,
) {
  const user = await UserModel.findOne({ _id: userId });
  if (!user) {
    throw new AppError("用户不存在", 404);
  }

  if (user.phone === input.newPhone) {
    throw new AppError("新手机号不能与当前手机号一致", 400);
  }

  const existingUser = await UserModel.findOne({ phone: input.newPhone });
  if (existingUser) {
    throw new AppError("新手机号已被使用", 400);
  }

  await consumeChangePhoneCode(user.phone, input.oldCode);
  await consumeChangePhoneCode(input.newPhone, input.newCode);

  const previousPhone = user.phone;
  user.phone = input.newPhone;
  await user.save();

  await writeSecurityLog(
    "phoneChange",
    "success",
    meta,
    `换绑手机号:${previousPhone}->${input.newPhone}`,
    user._id.toString(),
  );

  return {
    id: user._id.toString(),
    phone: maskPhone(user.phone),
    nickname: user.nickname,
    avatar: user.avatar ?? null,
  };
}
