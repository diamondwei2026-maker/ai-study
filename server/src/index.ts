import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { ChatOpenRouter } from "@langchain/openrouter";
import { HumanMessage } from "@langchain/core/messages";

import { connectDatabase } from "./config/db.js";
import { getServerEnv } from "./config/env.js";
import { avatarUploadDir } from "./config/paths.js";
import { createApp } from "./app.js";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createApp();

async function probeOpenRouter() {
  const env = getServerEnv();

  if (!env.openRouterModel || !env.openRouterApiKey || env.openRouterMock) {
    return;
  }

  const llm = new ChatOpenRouter({
    model: env.openRouterModel,
    apiKey: env.openRouterApiKey,
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
  const env = getServerEnv();

  await fs.mkdir(avatarUploadDir, { recursive: true });
  await connectDatabase();

  app.listen(env.port, async () => {
    logger.info({ port: env.port }, "server started");
    await probeOpenRouter();
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, "server bootstrap failed");
  process.exit(1);
});
