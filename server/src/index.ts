import fs from "node:fs/promises";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { ChatOpenRouter } from "@langchain/openrouter";
import { HumanMessage } from "@langchain/core/messages";

import { avatarUploadDir, createApp } from "./app.js";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量,dotenv默认只会找【当前命令运行目录】下的.env,所以这里要强制去父文件夹找
dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

const app = createApp();
const PORT = Number(process.env.PORT ?? 3000);

async function probeOpenRouter() {
  if (!process.env.OPENROUTER_MODEL || !process.env.OPENROUTER_API_KEY) {
    return;
  }

  const llm = new ChatOpenRouter({
    model: process.env.OPENROUTER_MODEL,
    apiKey: process.env.OPENROUTER_API_KEY,
    temperature: 0.7,
  });

  try {
    const test = await llm.invoke([new HumanMessage("hi")]);
    logger.info({ content: test.content }, "openrouter probe succeeded");
  } catch (error) {
    logger.error({ err: error }, "openrouter probe failed");
  }
}

async function bootstrap() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  await fs.mkdir(avatarUploadDir, { recursive: true });
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info("mongodb connected");

  app.listen(PORT, async () => {
    logger.info({ port: PORT }, "server started");
    await probeOpenRouter();
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, "server bootstrap failed");
  process.exit(1);
});
