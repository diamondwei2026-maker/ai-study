import bcrypt from "bcryptjs";

import RefreshTokenModel from "../../src/models/RefreshToken.js";
import SecurityLogModel from "../../src/models/SecurityLog.js";
import UserModel from "../../src/models/User.js";
import VerificationCodeModel, {
  type VerificationCodeType,
} from "../../src/models/VerificationCode.js";
import {
  generateAccessToken,
  generateRefreshToken,
  resolveExpiresInMs,
} from "../../src/utils/token.js";

const REFRESH_TOKEN_FALLBACK_MS = 30 * 24 * 60 * 60 * 1000;

export async function createUserFixture(options?: {
  phone?: string;
  nickname?: string;
  password?: string | null;
}) {
  const phone = options?.phone ?? "13800138000";
  const password = options?.password
    ? await bcrypt.hash(options.password, 10)
    : null;

  return UserModel.create({
    phone,
    nickname: options?.nickname ?? `用户${phone.slice(-4)}`,
    password,
    status: "active",
    loginFailCount: 0,
  });
}

export async function createVerificationCodeFixture(options?: {
  phone?: string;
  code?: string;
  type?: VerificationCodeType;
  used?: boolean;
  expiresAt?: Date;
}) {
  return VerificationCodeModel.create({
    phone: options?.phone ?? "13800138000",
    code: options?.code ?? "123456",
    type: options?.type ?? "login",
    used: options?.used ?? false,
    expiresAt: options?.expiresAt ?? new Date(Date.now() + 5 * 60 * 1000),
  });
}

export function createAccessTokenFixture(userId: string) {
  return generateAccessToken(userId);
}

export async function createRefreshTokenFixture(userId: string) {
  const token = generateRefreshToken(userId);
  await RefreshTokenModel.create({
    userId,
    token,
    expiresAt: new Date(
      Date.now() +
        resolveExpiresInMs(
          process.env.JWT_REFRESH_EXPIRES_IN,
          REFRESH_TOKEN_FALLBACK_MS,
        ),
    ),
  });

  return token;
}

export async function getSecurityLogs(action: string) {
  return SecurityLogModel.find({ action }).sort({ createdAt: 1 });
}
