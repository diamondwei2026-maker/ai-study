import type { RequestHandler } from "express";

import { sendFail } from "../utils/response.js";
import { verifyToken } from "../utils/token.js";

export const authMiddleware: RequestHandler = (request, response, next) => {
  const authorization = request.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return sendFail(response, "未认证或登录已过期", 401);
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    return sendFail(response, "未认证或登录已过期", 401);
  }

  try {
    const payload = verifyToken(token, "access");
    request.userId = payload.userId;
    return next();
  } catch {
    return sendFail(response, "未认证或登录已过期", 401);
  }
};

export default authMiddleware;
