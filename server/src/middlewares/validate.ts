import type { RequestHandler } from "express";
import { validationResult } from "express-validator";

import { sendFail } from "../utils/response.js";

export function createValidationMiddleware(options?: {
  message?: string;
  includeDetails?: boolean;
}): RequestHandler {
  return (request, response, next) => {
    const result = validationResult(request);
    if (result.isEmpty()) {
      return next();
    }

    return sendFail(
      response,
      options?.message ?? "请求参数错误",
      400,
      options?.includeDetails === false
        ? null
        : {
            errors: result.array({ onlyFirstError: true }).map((error) => ({
              field: "path" in error ? error.path : "unknown",
              message: error.msg,
            })),
          },
    );
  };
}

export const validateRequest = createValidationMiddleware();

export default validateRequest;
