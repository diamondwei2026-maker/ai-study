import type { RequestHandler } from "express";
import { validationResult } from "express-validator";

import { sendFail } from "../utils/response.js";

export const validateRequest: RequestHandler = (request, response, next) => {
  const result = validationResult(request);
  if (result.isEmpty()) {
    return next();
  }

  return sendFail(response, "请求参数错误", 400, {
    errors: result.array({ onlyFirstError: true }).map((error) => ({
      field: "path" in error ? error.path : "unknown",
      message: error.msg,
    })),
  });
};

export default validateRequest;
