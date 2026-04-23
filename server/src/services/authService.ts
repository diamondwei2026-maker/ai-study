import bcrypt from "bcryptjs";
import { Types } from "mongoose";

import RefreshTokenModel from "../models/RefreshToken.js";
import SecurityLogModel from "../models/SecurityLog.js";
import UserModel, { type UserDocument } from "../models/User.js";
import VerificationCodeModel, {
  type VerificationCodeType,
} from "../models/VerificationCode.js";
import type { RequestMeta } from "../utils/requestMeta.js";
import { AppError } from "../utils/response.js";
import {
  generateAccessToken,
  generateRefreshToken,
  resolveExpiresInMs,
  verifyToken,
} from "../utils/token.js";
import smsService from "./smsService.js";

const VERIFICATION_CODE_EXPIRES_MS = 5 * 60 * 1000;
const VERIFICATION_CODE_COOLDOWN_MS = 60 * 1000;
const PASSWORD_LOCK_THRESHOLD = 5;
const PASSWORD_LOCK_MS = 30 * 60 * 1000;
const PASSWORD_SALT_ROUNDS = 10;
const REFRESH_TOKEN_FALLBACK_MS = 30 * 24 * 60 * 60 * 1000;

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    nickname: string;
    avatar: string | null;
  };
}

export interface LoginInput {
  phone: string;
  code?: string;
  password?: string;
}

export interface ChangePhoneInput {
  oldCode: string;
  newPhone: string;
  newCode: string;
}

function getDefaultNickname(phone: string) {
  return `用户${phone.slice(-4)}`;
}

function maskPhone(phone: string) {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
}

function buildAuthPayload(
  user: UserDocument,
  accessToken: string,
  refreshToken: string,
): AuthPayload {
  const userId = user._id.toString();

  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      phone: maskPhone(user.phone),
      nickname: user.nickname,
      avatar: user.avatar ?? null,
    },
  };
}

function getRefreshTokenExpiresAt() {
  return new Date(
    Date.now() +
      resolveExpiresInMs(
        process.env.JWT_REFRESH_EXPIRES_IN,
        REFRESH_TOKEN_FALLBACK_MS,
      ),
  );
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

async function consumeVerificationCode(
  phone: string,
  code: string,
  type: VerificationCodeType,
) {
  const verificationCode = await VerificationCodeModel.findOneAndUpdate(
    {
      phone,
      code,
      type,
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

async function persistRefreshToken(
  userId: string,
  refreshToken: string,
  meta: RequestMeta,
) {
  await RefreshTokenModel.create({
    userId: new Types.ObjectId(userId),
    token: refreshToken,
    deviceInfo: meta.deviceInfo ?? null,
    expiresAt: getRefreshTokenExpiresAt(),
  });
}

async function issueTokens(user: UserDocument, meta: RequestMeta) {
  const userId = user._id.toString();
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  await persistRefreshToken(userId, refreshToken, meta);
  return buildAuthPayload(user, accessToken, refreshToken);
}

async function unlockExpiredUser(user: UserDocument) {
  if (user.lockedUntil && user.lockedUntil.getTime() <= Date.now()) {
    user.status = "active";
    user.loginFailCount = 0;
    user.lockedUntil = null;
    await user.save();
  }
}

async function failPasswordLogin(user: UserDocument, meta: RequestMeta) {
  const nextFailCount = user.loginFailCount + 1;
  const shouldLock = nextFailCount >= PASSWORD_LOCK_THRESHOLD;
  const lockedUntil = shouldLock
    ? new Date(Date.now() + PASSWORD_LOCK_MS)
    : null;

  user.loginFailCount = nextFailCount;
  user.status = shouldLock ? "locked" : "active";
  user.lockedUntil = lockedUntil;
  await user.save();

  await writeSecurityLog(
    "login",
    "failure",
    meta,
    shouldLock ? "密码连续错误过多，账号已锁定" : "密码错误",
    user._id.toString(),
  );

  if (shouldLock) {
    throw new AppError("账号已锁定", 403, {
      lockedUntil: lockedUntil?.toISOString() ?? null,
    });
  }

  throw new AppError("手机号或密码错误", 400);
}

async function resetLoginLock(user: UserDocument) {
  user.status = "active";
  user.loginFailCount = 0;
  user.lockedUntil = null;
  await user.save();
}

export async function sendCode(
  phone: string,
  type: VerificationCodeType,
  meta: RequestMeta,
) {
  const existingUser = await UserModel.findOne({ phone });

  if (type === "register" && existingUser) {
    throw new AppError("手机号已注册", 400);
  }

  if ((type === "login" || type === "resetPassword") && !existingUser) {
    throw new AppError("账号不存在", 404);
  }

  const recentCode = await VerificationCodeModel.findOne({
    phone,
    type,
    createdAt: { $gt: new Date(Date.now() - VERIFICATION_CODE_COOLDOWN_MS) },
  }).sort({ createdAt: -1 });

  if (recentCode) {
    throw new AppError("请求过于频繁，请稍后再试", 429);
  }

  const code = generateVerificationCode();
  await VerificationCodeModel.create({
    phone,
    code,
    type,
    expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRES_MS),
  });

  await smsService.sendCode({ phone, code, type });
  await writeSecurityLog("sendCode", "success", meta, `${type}:${phone}`);

  return null;
}

export async function register(phone: string, code: string, meta: RequestMeta) {
  await consumeVerificationCode(phone, code, "register");

  const existingUser = await UserModel.findOne({ phone });
  if (existingUser) {
    throw new AppError("手机号已注册", 400);
  }

  const user = await UserModel.create({
    phone,
    nickname: getDefaultNickname(phone),
    status: "active",
    loginFailCount: 0,
  });

  const payload = await issueTokens(user, meta);
  await writeSecurityLog(
    "register",
    "success",
    meta,
    "手机号注册成功",
    user._id.toString(),
  );
  return payload;
}

export async function login(input: LoginInput, meta: RequestMeta) {
  const user = await UserModel.findOne({ phone: input.phone });
  if (!user) {
    await writeSecurityLog(
      "login",
      "failure",
      meta,
      `手机号不存在:${input.phone}`,
    );
    throw new AppError("账号不存在", 404);
  }

  await unlockExpiredUser(user);

  if (input.code) {
    await consumeVerificationCode(input.phone, input.code, "login");
    await resetLoginLock(user);
    const payload = await issueTokens(user, meta);
    await writeSecurityLog(
      "login",
      "success",
      meta,
      "验证码登录成功",
      user._id.toString(),
    );
    return payload;
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await writeSecurityLog(
      "login",
      "failure",
      meta,
      "账号处于锁定状态",
      user.id,
    );
    throw new AppError("账号已锁定", 403, {
      lockedUntil: user.lockedUntil.toISOString(),
    });
  }

  if (!input.password || !user.password) {
    throw new AppError("手机号或密码错误", 400);
  }

  const matched = await bcrypt.compare(input.password, user.password);
  if (!matched) {
    return failPasswordLogin(user, meta);
  }

  await resetLoginLock(user);
  const payload = await issueTokens(user, meta);
  await writeSecurityLog(
    "login",
    "success",
    meta,
    "密码登录成功",
    user._id.toString(),
  );
  return payload;
}

export async function refreshToken(refreshTokenValue: string) {
  let payload;

  try {
    payload = verifyToken(refreshTokenValue, "refresh");
  } catch {
    throw new AppError("Refresh Token 无效或已过期", 401);
  }

  const record = await RefreshTokenModel.findOne({
    token: refreshTokenValue,
    expiresAt: { $gt: new Date() },
  });

  if (!record || record.userId.toString() !== payload.userId) {
    throw new AppError("Refresh Token 无效或已过期", 401);
  }

  const user = await UserModel.findById(payload.userId);
  if (!user) {
    throw new AppError("用户不存在", 404);
  }

  return {
    accessToken: generateAccessToken(user.id),
  };
}

export async function logout(
  userId: string,
  refreshTokenValue: string,
  meta: RequestMeta,
) {
  await RefreshTokenModel.deleteOne({
    userId: new Types.ObjectId(userId),
    token: refreshTokenValue,
  });

  await writeSecurityLog("logout", "success", meta, "退出登录", userId);
  return null;
}

export async function setPassword(
  userId: string,
  password: string,
  meta: RequestMeta,
) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("用户不存在", 404);
  }

  if (user.password) {
    throw new AppError("密码已设置，请使用修改密码功能", 400);
  }

  user.password = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  await user.save();

  await writeSecurityLog(
    "passwordSet",
    "success",
    meta,
    "首次设置密码",
    user._id.toString(),
  );
  return null;
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
  meta: RequestMeta,
) {
  const user = await UserModel.findById(userId);
  if (!user || !user.password) {
    throw new AppError("旧密码不正确", 400);
  }

  const matched = await bcrypt.compare(oldPassword, user.password);
  if (!matched) {
    await writeSecurityLog(
      "passwordChange",
      "failure",
      meta,
      "旧密码错误",
      userId,
    );
    throw new AppError("旧密码不正确", 400);
  }

  user.password = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
  await user.save();

  await writeSecurityLog(
    "passwordChange",
    "success",
    meta,
    "修改密码成功",
    user._id.toString(),
  );
  return null;
}

export async function resetPassword(
  phone: string,
  code: string,
  newPassword: string,
  meta: RequestMeta,
) {
  await consumeVerificationCode(phone, code, "resetPassword");

  const user = await UserModel.findOne({ phone });
  if (!user) {
    throw new AppError("账号不存在", 404);
  }

  user.password = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
  user.loginFailCount = 0;
  user.status = "active";
  user.lockedUntil = null;
  await user.save();

  await RefreshTokenModel.deleteMany({ userId: user._id });
  await writeSecurityLog(
    "passwordReset",
    "success",
    meta,
    "重置密码成功",
    user._id.toString(),
  );
  return null;
}
