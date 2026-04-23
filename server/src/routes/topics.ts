import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { body } from "express-validator";

import authMiddleware from "../middlewares/auth.js";
import { topicsRateLimiter } from "../middlewares/rateLimit.js";
import { createValidationMiddleware } from "../middlewares/validate.js";
import { createTopicForUser } from "../services/topicService.js";
import { parseTopicTitle } from "../services/answerService.js";
import { getRequestMeta } from "../utils/requestMeta.js";
import { sendSuccess } from "../utils/response.js";

const router = Router();

router.post(
  "/",
  [
    topicsRateLimiter,
    authMiddleware,
    body("title").custom((value) => {
      parseTopicTitle(value);
      return true;
    }),
    createValidationMiddleware({
      message: "标题需为 1-30 字纯文字内容",
      includeDetails: false,
    }),
  ],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await createTopicForUser(
        request.userId!,
        request.body.title,
        getRequestMeta(request),
      );

      sendSuccess(response, result, "知识点创建成功");
    } catch (error) {
      next(error);
    }
  },
);

export default router;
