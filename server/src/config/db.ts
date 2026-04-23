import mongoose from "mongoose";

import { logger } from "../utils/logger.js";
import { getServerEnv } from "./env.js";

function redactMongoUri(uri: string) {
  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = "***";
    }
    return parsed.toString();
  } catch {
    return uri.replace(/\/\/(.*?):(.*?)@/, "//$1:***@");
  }
}

export async function connectDatabase(uri = getServerEnv().mongodbUri) {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    return mongoose.connection.asPromise();
  }

  await mongoose.connect(uri);
  logger.info({ mongodbUri: redactMongoUri(uri) }, "mongodb connected");
  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  logger.info("mongodb disconnected");
}

export default connectDatabase;
