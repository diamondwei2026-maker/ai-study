import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { body } from "express-validator";
import multer from "multer";

import { avatarUploadDir } from "../config/paths.js";
import authMiddleware from "../middlewares/auth.js";
import validateRequest from "../middlewares/validate.js";
import {
  changePhone,
  getProfile,
  updateProfile,
  uploadAvatar,
} from "../services/userService.js";
import { getRequestMeta } from "../utils/requestMeta.js";
import { AppError, sendSuccess } from "../utils/response.js";

const router = Router();

const storage = multer.diskStorage({
  destination: avatarUploadDir,
  filename: (_request, file, callback) => {
    callback(
      null,
      `${Date.now()}-${randomUUID()}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_request, file, callback) => {
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      callback(new AppError("仅支持上传 jpg 或 png 图片", 400));
      return;
    }

    callback(null, true);
  },
});

router.get("/profile", authMiddleware, async (request, response, next) => {
  try {
    const profile = await getProfile(request.userId!);
    sendSuccess(response, profile);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/profile",
  [
    authMiddleware,
    body("nickname")
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage("昵称长度需为 1 到 20 个字符"),
    validateRequest,
  ],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const profile = await updateProfile(
        request.userId!,
        request.body.nickname,
      );
      sendSuccess(response, profile, "资料更新成功");
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/avatar",
  authMiddleware,
  upload.single("avatar"),
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      if (!request.file) {
        throw new AppError("请上传头像文件", 400);
      }

      const avatarPath = `/uploads/avatars/${request.file.filename}`;
      const profile = await uploadAvatar(request.userId!, avatarPath);
      sendSuccess(response, profile, "头像更新成功");
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/change-phone",
  [
    authMiddleware,
    body("oldCode")
      .trim()
      .matches(/^\d{6}$/)
      .withMessage("原手机号验证码必须为 6 位数字"),
    body("newPhone")
      .trim()
      .matches(/^1\d{10}$/)
      .withMessage("请输入有效的新手机号"),
    body("newCode")
      .trim()
      .matches(/^\d{6}$/)
      .withMessage("新手机号验证码必须为 6 位数字"),
    validateRequest,
  ],
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const profile = await changePhone(
        request.userId!,
        {
          oldCode: request.body.oldCode,
          newPhone: request.body.newPhone,
          newCode: request.body.newCode,
        },
        getRequestMeta(request),
      );
      sendSuccess(response, profile, "换绑手机号成功");
    } catch (error) {
      next(error);
    }
  },
);

export default router;
