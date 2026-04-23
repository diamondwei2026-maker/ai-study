import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

export type TokenType = "access" | "refresh";

export interface AuthTokenPayload extends JwtPayload {
  userId: string;
  type: TokenType;
}

const ACCESS_TOKEN_FALLBACK = "2h";
const REFRESH_TOKEN_FALLBACK = "30d";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

function signToken(
  userId: string,
  type: TokenType,
  expiresIn: SignOptions["expiresIn"],
) {
  return jwt.sign({ userId, type }, getJwtSecret(), { expiresIn });
}

export function generateAccessToken(userId: string) {
  return signToken(
    userId,
    "access",
    (process.env.JWT_EXPIRES_IN ??
      ACCESS_TOKEN_FALLBACK) as SignOptions["expiresIn"],
  );
}

export function generateRefreshToken(userId: string) {
  return signToken(
    userId,
    "refresh",
    (process.env.JWT_REFRESH_EXPIRES_IN ??
      REFRESH_TOKEN_FALLBACK) as SignOptions["expiresIn"],
  );
}

export function verifyToken(token: string, expectedType?: TokenType) {
  const payload = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;

  if (!payload.userId || !payload.type) {
    throw new Error("Invalid token payload");
  }

  if (expectedType && payload.type !== expectedType) {
    throw new Error("Invalid token type");
  }

  return payload;
}

export function resolveExpiresInMs(
  value: string | undefined,
  fallbackMs: number,
) {
  if (!value) {
    return fallbackMs;
  }

  if (/^\d+$/.test(value)) {
    return Number(value) * 1000;
  }

  const matched = value.trim().match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!matched) {
    return fallbackMs;
  }

  const amount = Number(matched[1]);
  const unit = matched[2].toLowerCase();

  switch (unit) {
    case "ms":
      return amount;
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      return fallbackMs;
  }
}
