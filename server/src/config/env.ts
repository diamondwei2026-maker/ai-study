import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

function toPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export interface ServerEnv {
  port: number;
  mongodbUri: string;
  openRouterModel: string;
  openRouterApiKey: string;
  openRouterMock: boolean;
  openRouterTimeoutMs: number;
  apiRateLimitWindowMs: number;
  apiRateLimitMax: number;
  topicsRateLimitWindowMs: number;
  topicsRateLimitMax: number;
}

export function getServerEnv(): ServerEnv {
  return {
    port: toPositiveInteger(process.env.PORT, 3000),
    mongodbUri: process.env.MONGODB_URI ?? "",
    openRouterModel: process.env.OPENROUTER_MODEL ?? "",
    openRouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
    openRouterMock: process.env.OPENROUTER_MOCK === "true",
    openRouterTimeoutMs: toPositiveInteger(
      process.env.OPENROUTER_TIMEOUT_MS,
      12000,
    ),
    apiRateLimitWindowMs: toPositiveInteger(
      process.env.API_RATE_LIMIT_WINDOW_MS,
      60_000,
    ),
    apiRateLimitMax: toPositiveInteger(process.env.API_RATE_LIMIT_MAX, 120),
    topicsRateLimitWindowMs: toPositiveInteger(
      process.env.TOPICS_RATE_LIMIT_WINDOW_MS,
      60_000,
    ),
    topicsRateLimitMax: toPositiveInteger(
      process.env.TOPICS_RATE_LIMIT_MAX,
      20,
    ),
  };
}

export default getServerEnv;
