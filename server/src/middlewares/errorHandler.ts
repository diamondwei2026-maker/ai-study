import type { ErrorRequestHandler } from "express";

import { AppError, sendFail } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (response.headersSent) {
    return;
  }

  if (error instanceof AppError) {
    sendFail(response, error.message, error.statusCode, error.data ?? null);
    return;
  }

  logger.error({ err: error }, "unexpected server error");
  sendFail(response, "服务器内部错误", 500);
};

export default errorHandler;
