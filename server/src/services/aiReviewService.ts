import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenRouter } from "@langchain/openrouter";

import { getServerEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/response.js";
import type { ReviewJudgment } from "../models/ReviewAttempt.js";

export interface ReviewEvaluationInput {
  knowledgePointTitle: string;
  standardAnswer: string;
  submissionText: string;
}

export interface ReviewEvaluationResult {
  judgment: ReviewJudgment;
  reason: string;
}

const REVIEW_FAILURE_MESSAGE = "AI 判定失败，请稍后重试";
const INVALID_SUBMISSION_MESSAGE = "费曼输出不能为空，且仅支持纯文字内容";
const DISALLOWED_SUBMISSION_PATTERNS = [
  /https?:\/\/\S+/i,
  /\bwww\.\S+/i,
  /!\[[^\]]*\]\([^)]*\)/,
  /\[[^\]]+\]\([^)]*\)/,
  /<[^>]+>/,
  /```/,
  /`[^`]+`/,
];

function stringifyModelContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (typeof item === "object" && item && "text" in item) {
          return String((item as { text?: unknown }).text ?? "");
        }

        return JSON.stringify(item);
      })
      .join("\n");
  }

  return String(content ?? "");
}

function extractJsonObject(value: string) {
  const codeFenceMatch = value.match(/```json\s*([\s\S]*?)```/i);
  if (codeFenceMatch?.[1]) {
    return codeFenceMatch[1].trim();
  }

  const objectStart = value.indexOf("{");
  const objectEnd = value.lastIndexOf("}");
  if (objectStart === -1 || objectEnd === -1 || objectEnd <= objectStart) {
    return "";
  }

  return value.slice(objectStart, objectEnd + 1).trim();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function uniqueTokens(text: string) {
  return [...new Set(text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? [])];
}

function scoreSubmission(standardAnswer: string, submissionText: string) {
  const standardTokens = uniqueTokens(standardAnswer);
  const submissionTokens = uniqueTokens(submissionText);
  const overlapCount = submissionTokens.filter((token) =>
    standardTokens.includes(token),
  ).length;
  const overlapScore =
    standardTokens.length === 0 ? 0 : overlapCount / standardTokens.length;
  const submissionLength = Array.from(submissionText).length;

  if (submissionLength < 40 || overlapScore < 0.18) {
    return {
      judgment: "UNMASTERED" as const,
      reason:
        "你的解释过短或与标准答案的关键概念重合较少，说明当前理解还不稳定。",
    };
  }

  if (submissionLength < 90 || overlapScore < 0.42) {
    return {
      judgment: "FUZZY" as const,
      reason:
        "你已经抓住了部分核心意思，但对关键机制或边界条件的说明还不够完整。",
    };
  }

  return {
    judgment: "MASTERED" as const,
    reason: "你的解释覆盖了主要概念，并能用通俗语言把关键机制表达清楚。",
  };
}

function parseEvaluationPayload(content: unknown): ReviewEvaluationResult {
  const rawText = stringifyModelContent(content);
  const jsonText = extractJsonObject(rawText);

  if (!jsonText) {
    throw new Error("missing JSON payload");
  }

  const payload = JSON.parse(jsonText) as Partial<ReviewEvaluationResult>;

  if (
    !payload.reason ||
    !payload.judgment ||
    !["MASTERED", "FUZZY", "UNMASTERED"].includes(payload.judgment)
  ) {
    throw new Error("invalid evaluation payload");
  }

  return {
    judgment: payload.judgment,
    reason: payload.reason.trim(),
  };
}

export function parseReviewSubmission(value: unknown) {
  if (typeof value !== "string") {
    throw new AppError(INVALID_SUBMISSION_MESSAGE, 400);
  }

  const sanitized = value.replace(/\u00a0/g, " ").trim();

  if (
    !sanitized ||
    DISALLOWED_SUBMISSION_PATTERNS.some((pattern) => pattern.test(sanitized))
  ) {
    throw new AppError(INVALID_SUBMISSION_MESSAGE, 400);
  }

  return sanitized;
}

export async function evaluateReviewSubmission(
  input: ReviewEvaluationInput,
): Promise<ReviewEvaluationResult> {
  const env = getServerEnv();

  if (env.openRouterMock) {
    return scoreSubmission(input.standardAnswer, input.submissionText);
  }

  if (!env.openRouterApiKey || !env.openRouterModel) {
    throw new AppError(REVIEW_FAILURE_MESSAGE, 502, { draftRetained: true });
  }

  const llm = new ChatOpenRouter({
    model: env.openRouterModel,
    apiKey: env.openRouterApiKey,
    temperature: 0.1,
  });

  const prompt = [
    "你是费曼复习判定助手。",
    "请基于用户提交内容和标准答案，输出 JSON，不要输出任何额外说明。",
    'JSON 结构必须是：{"judgment":"MASTERED|FUZZY|UNMASTERED","reason":string}。',
    "若用户解释过短、偏题、缺少关键机制，请给 FUZZY 或 UNMASTERED。",
    `知识点：${input.knowledgePointTitle}`,
    `标准答案：${input.standardAnswer}`,
    `用户提交：${input.submissionText}`,
  ].join("\n");

  const startedAt = Date.now();

  try {
    const response = await withTimeout(
      llm.invoke([new HumanMessage(prompt)]),
      env.openRouterTimeoutMs,
    );

    const parsed = parseEvaluationPayload(response.content);

    logger.info(
      {
        knowledgePointTitle: input.knowledgePointTitle,
        judgment: parsed.judgment,
        durationMs: Date.now() - startedAt,
      },
      "review evaluation generated",
    );

    return parsed;
  } catch (error) {
    logger.error(
      {
        err: error,
        knowledgePointTitle: input.knowledgePointTitle,
        durationMs: Date.now() - startedAt,
      },
      "failed to evaluate review submission",
    );

    throw new AppError(REVIEW_FAILURE_MESSAGE, 502, { draftRetained: true });
  }
}

export default evaluateReviewSubmission;
