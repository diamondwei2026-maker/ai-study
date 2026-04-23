import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { body, param, query } from "express-validator";

import authMiddleware from "../middlewares/auth.js";
import { createValidationMiddleware } from "../middlewares/validate.js";
import { parseReviewSubmission } from "../services/aiReviewService.js";
import {
  getReviewTaskDetailForUser,
  submitReviewTaskForUser,
} from "../services/reviewExecutionService.js";
import { getReviewListForUser } from "../services/reviewListService.js";
import { sendSuccess } from "../utils/response.js";

const router = Router();

function getSingleRouteParam(value: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

router.get(
  "/tasks",
  [
    authMiddleware,
    query("tab")
      .optional()
      .isIn(["pending", "overdue", "all"])
      .withMessage("tab 参数不合法"),
    createValidationMiddleware(),
  ],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await getReviewListForUser(
        request.userId!,
        (request.query.tab as "pending" | "overdue" | "all" | undefined) ??
          "pending",
      );
      sendSuccess(response, result);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/tasks/:taskId",
  [authMiddleware, param("taskId").isString(), createValidationMiddleware()],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const taskId = getSingleRouteParam(request.params.taskId);
      const result = await getReviewTaskDetailForUser(request.userId!, taskId);
      sendSuccess(response, result);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/tasks/:taskId/submit",
  [
    authMiddleware,
    param("taskId").isString(),
    body("content").custom((value) => {
      parseReviewSubmission(value);
      return true;
    }),
    createValidationMiddleware({
      message: "费曼输出不能为空，且仅支持纯文字内容",
      includeDetails: false,
    }),
  ],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const taskId = getSingleRouteParam(request.params.taskId);
      const result = await submitReviewTaskForUser({
        userId: request.userId!,
        taskId,
        content: parseReviewSubmission(request.body.content),
      });
      sendSuccess(response, result, "review completed");
    } catch (error) {
      next(error);
    }
  },
);

export default router;
