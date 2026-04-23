import express from "express";
import cors from "cors";
import path from "node:path";

import errorHandler from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import { sendSuccess } from "./utils/response.js";

export const uploadsRoot = path.resolve(process.cwd(), "uploads");
export const avatarUploadDir = path.join(uploadsRoot, "avatars");

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use("/uploads", express.static(uploadsRoot));

  app.get("/healthz", (_request, response) => {
    sendSuccess(response, { ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use(errorHandler);

  return app;
}

export default createApp;
