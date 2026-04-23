import rateLimit, {
  ipKeyGenerator,
  type RateLimitRequestHandler,
} from "express-rate-limit";

import { getServerEnv } from "../config/env.js";
import { sendFail } from "../utils/response.js";

function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (request) =>
      request.userId ?? ipKeyGenerator(request.ip ?? "anonymous"),
    handler: (_request, response) => {
      sendFail(response, options.message ?? "请求过于频繁，请稍后再试", 429);
    },
  });
}

const env = getServerEnv();

export const apiRateLimiter = createRateLimiter({
  windowMs: env.apiRateLimitWindowMs,
  max: env.apiRateLimitMax,
});

export const topicsRateLimiter = createRateLimiter({
  windowMs: env.topicsRateLimitWindowMs,
  max: env.topicsRateLimitMax,
});

export default createRateLimiter;
