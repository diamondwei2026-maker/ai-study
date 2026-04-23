import type { Request } from "express";

export interface RequestMeta {
  ip?: string;
  deviceInfo?: string;
}

export function getRequestMeta(request: Request): RequestMeta {
  const forwardedFor = request.headers["x-forwarded-for"];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : request.ip;

  const deviceInfo =
    typeof request.headers["user-agent"] === "string"
      ? request.headers["user-agent"]
      : undefined;

  return {
    ip,
    deviceInfo,
  };
}
