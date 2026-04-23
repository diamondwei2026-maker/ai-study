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
  changePassword,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
  sendCode,
  setPassword,
} from "../services/authService.js";
import { getRequestMeta } from "../utils/requestMeta.js";
import { sendSuccess } from "../utils/response.js";

const router = Router();

const PHONE_PATTERN = /^1\d{10}$/;
const CODE_PATTERN = /^\d{6}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const phoneRule = body("phone")
  .trim()
  .matches(PHONE_PATTERN)
  .withMessage("请输入有效的手机号");

const codeRule = body("code")
  .trim()
  .matches(CODE_PATTERN)
  .withMessage("验证码必须为 6 位数字");

const passwordRule = (field: string) =>
  body(field)
    .trim()
    .matches(PASSWORD_PATTERN)
    .withMessage("密码至少 8 位，且需同时包含字母和数字");

router.post(
  "/send-code",
  [
    phoneRule,
    body("type")
      .trim()
      .isIn(["register", "login", "resetPassword", "changePhone"])
      .withMessage("验证码类型不支持"),
    validateRequest,
  ],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await sendCode(
        request.body.phone,
        request.body.type,
        getRequestMeta(request),
      );
      sendSuccess(response, null, "验证码已发送");
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/register",
  [phoneRule, codeRule, validateRequest],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = await register(
        request.body.phone,
        request.body.code,
        getRequestMeta(request),
      );
      sendSuccess(response, payload, "注册成功");
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/login",
  [
    phoneRule,
    body("code")
      .optional()
      .trim()
      .matches(CODE_PATTERN)
      .withMessage("验证码必须为 6 位数字"),
    body("password")
      .optional()
      .trim()
      .matches(PASSWORD_PATTERN)
      .withMessage("密码至少 8 位，且需同时包含字母和数字"),
    body().custom((value) => {
      if (!value.code && !value.password) {
        throw new Error("验证码和密码至少填写一项");
      }
      return true;
    }),
    validateRequest,
  ],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = await login(
        {
          phone: request.body.phone,
          code: request.body.code,
          password: request.body.password,
        },
        getRequestMeta(request),
      );
      sendSuccess(response, payload, "登录成功");
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/refresh",
  [
    body("refreshToken").trim().notEmpty().withMessage("refreshToken 不能为空"),
    validateRequest,
  ],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = await refreshToken(request.body.refreshToken);
      sendSuccess(response, payload);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/logout",
  [
    authMiddleware,
    body("refreshToken").trim().notEmpty().withMessage("refreshToken 不能为空"),
    validateRequest,
  ],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await logout(
        request.userId!,
        request.body.refreshToken,
        getRequestMeta(request),
      );
      sendSuccess(response, null, "已退出登录");
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/password/set",
  [authMiddleware, passwordRule("password"), validateRequest],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await setPassword(
        request.userId!,
        request.body.password,
        getRequestMeta(request),
      );
      sendSuccess(response, null, "密码设置成功");
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/password/change",
  [
    authMiddleware,
    passwordRule("oldPassword"),
    passwordRule("newPassword"),
    validateRequest,
  ],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await changePassword(
        request.userId!,
        request.body.oldPassword,
        request.body.newPassword,
        getRequestMeta(request),
      );
      sendSuccess(response, null, "密码修改成功");
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/password/reset",
  [phoneRule, codeRule, passwordRule("newPassword"), validateRequest],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await resetPassword(
        request.body.phone,
        request.body.code,
        request.body.newPassword,
        getRequestMeta(request),
      );
      sendSuccess(response, null, "密码重置成功");
    } catch (error) {
      next(error);
    }
  },
);

export default router;
