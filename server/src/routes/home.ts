import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { body } from "express-validator";

import authMiddleware from "../middlewares/auth.js";
import validateRequest from "../middlewares/validate.js";
import {
  getHomeDashboard,
  recordHomeActionEvent,
} from "../services/homeService.js";
import { getRequestMeta } from "../utils/requestMeta.js";
import { sendSuccess } from "../utils/response.js";

const router = Router();

router.get(
  "/dashboard",
  authMiddleware,
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const dashboard = await getHomeDashboard(request.userId!);
      sendSuccess(response, dashboard);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/action-events",
  [
    authMiddleware,
    body("actionKey")
      .trim()
      .isIn(["createTopic", "startReview", "guidanceAction"])
      .withMessage("actionKey 不支持"),
    body("targetModule").trim().notEmpty().withMessage("targetModule 不能为空"),
    body("guidanceType")
      .optional({ values: "falsy" })
      .trim()
      .isIn(["CREATE_FIRST", "REVIEW_NOW", "KEEP_MOMENTUM", "CHECK_PROGRESS"])
      .withMessage("guidanceType 不支持"),
    body("result")
      .trim()
      .isIn(["success", "blocked", "failed"])
      .withMessage("result 不支持"),
    body("deviceInfo")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 200 })
      .withMessage("deviceInfo 长度不能超过 200 个字符"),
    validateRequest,
  ],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await recordHomeActionEvent(
        request.userId!,
        {
          actionKey: request.body.actionKey,
          targetModule: request.body.targetModule,
          guidanceType: request.body.guidanceType,
          result: request.body.result,
          deviceInfo: request.body.deviceInfo,
        },
        getRequestMeta(request),
      );

      sendSuccess(response, null, "event recorded");
    } catch (error) {
      next(error);
    }
  },
);

export default router;
