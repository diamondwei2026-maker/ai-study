import fs from "node:fs/promises";

import type { Express } from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { createApp } from "../../src/app.js";
import { avatarUploadDir } from "../../src/config/paths.js";

export interface TestAppContext {
  app: Express;
  mongo: MongoMemoryServer;
}

export async function setupTestApp(): Promise<TestAppContext> {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "2h";
  process.env.JWT_REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";
  process.env.SMS_MOCK = "true";

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();

  await fs.mkdir(avatarUploadDir, { recursive: true });
  await mongoose.connect(process.env.MONGODB_URI);

  return {
    app: createApp(),
    mongo,
  };
}

export async function clearDatabase() {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) =>
      collection.deleteMany({}),
    ),
  );
}

export async function teardownTestApp(context: TestAppContext) {
  await clearDatabase();
  await mongoose.disconnect();
  await context.mongo.stop();
}
