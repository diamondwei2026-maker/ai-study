import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenRouter } from "@langchain/openrouter";

import { getServerEnv } from "../config/env.js";
import SharedStandardAnswerModel from "../models/SharedStandardAnswer.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/response.js";

export interface ParsedTopicTitle {
  sanitizedTitle: string;
  normalizedTitle: string;
  characterCount: number;
}

export interface ResolvedStandardAnswer {
  sharedAnswerId: string;
  canonicalTitle: string;
  normalizedCanonicalTitle: string;
  aliases: string[];
  answerContent: string;
  answerSource: "reused" | "generated";
  durationMs: number;
}

interface GeneratedAnswerPayload {
  canonicalTitle: string;
  aliases: string[];
  answerContent: string;
}

const TITLE_MAX_LENGTH = 30;
const INVALID_TITLE_MESSAGE = "标题需为 1-30 字纯文字内容";
const ANSWER_FAILURE_MESSAGE = "标准答案生成失败，请稍后重试";
const DISALLOWED_TITLE_PATTERNS = [
  /https?:\/\/\S+/i,
  /\bwww\.\S+/i,
  /!\[[^\]]*\]\([^)]*\)/,
  /\[[^\]]+\]\([^)]*\)/,
  /<[^>]+>/,
  /```/,
  /`[^`]+`/,
  /(^|\s)#{1,6}\s/,
  /[\r\n]/,
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

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
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

export function normalizeTopicTitle(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

export function parseTopicTitle(value: unknown): ParsedTopicTitle {
  if (typeof value !== "string") {
    throw new AppError(INVALID_TITLE_MESSAGE, 400);
  }

  const sanitizedTitle = value.trim();
  const characterCount = Array.from(sanitizedTitle).length;
  const normalizedTitle = normalizeTopicTitle(sanitizedTitle);

  if (
    !sanitizedTitle ||
    !normalizedTitle ||
    characterCount < 1 ||
    characterCount > TITLE_MAX_LENGTH ||
    DISALLOWED_TITLE_PATTERNS.some((pattern) => pattern.test(sanitizedTitle))
  ) {
    throw new AppError(INVALID_TITLE_MESSAGE, 400);
  }

  return {
    sanitizedTitle,
    normalizedTitle,
    characterCount,
  };
}

function buildMockAnswerPayload(title: string): GeneratedAnswerPayload {
  return {
    canonicalTitle: title,
    aliases: [title],
    answerContent: `${title}是一个需要从定义、关键机制和典型例子三个角度解释的知识点。你可以先说明它是什么，再说明它为什么重要，最后补一个简单例子帮助记忆。`,
  };
}

function parseGeneratedAnswerPayload(content: unknown) {
  const rawText = stringifyModelContent(content);
  const jsonText = extractJsonObject(rawText);

  if (!jsonText) {
    throw new Error("missing JSON payload");
  }

  const payload = JSON.parse(jsonText) as Partial<GeneratedAnswerPayload>;

  if (
    !payload.canonicalTitle ||
    !payload.answerContent ||
    !Array.isArray(payload.aliases)
  ) {
    throw new Error("incomplete JSON payload");
  }

  return {
    canonicalTitle: payload.canonicalTitle.trim(),
    aliases: payload.aliases
      .map((alias) => String(alias).trim())
      .filter(Boolean),
    answerContent: payload.answerContent.trim(),
  } satisfies GeneratedAnswerPayload;
}

async function generateAnswerWithModel(
  title: string,
): Promise<GeneratedAnswerPayload> {
  const env = getServerEnv();

  if (env.openRouterMock) {
    return buildMockAnswerPayload(title);
  }

  if (!env.openRouterApiKey || !env.openRouterModel) {
    throw new AppError(ANSWER_FAILURE_MESSAGE, 502);
  }

  const llm = new ChatOpenRouter({
    model: env.openRouterModel,
    apiKey: env.openRouterApiKey,
    temperature: 0.2,
  });

  const prompt = [
    "你是知识点标准答案生成器。",
    "请把用户标题规范化后输出 JSON，不要输出任何额外说明。",
    'JSON 结构必须是：{"canonicalTitle":string,"aliases":string[],"answerContent":string}。',
    "aliases 至少包含 canonicalTitle 和用户原始标题，answerContent 必须是简洁、可复用的纯文本标准答案。",
    `用户标题：${title}`,
  ].join("\n");

  const startedAt = Date.now();

  try {
    const response = await withTimeout(
      llm.invoke([new HumanMessage(prompt)]),
      env.openRouterTimeoutMs,
    );

    const parsed = parseGeneratedAnswerPayload(response.content);

    logger.info(
      {
        canonicalTitle: parsed.canonicalTitle,
        durationMs: Date.now() - startedAt,
      },
      "openrouter standard answer generated",
    );

    return parsed;
  } catch (error) {
    logger.error(
      {
        err: error,
        title,
        durationMs: Date.now() - startedAt,
      },
      "failed to generate standard answer",
    );
    throw new AppError(ANSWER_FAILURE_MESSAGE, 502);
  }
}

function normalizeAliases(values: string[]) {
  return uniqueStrings(values.map((value) => normalizeTopicTitle(value)));
}

export async function resolveStandardAnswer(
  title: string,
  normalizedTitle: string,
): Promise<ResolvedStandardAnswer> {
  const startedAt = Date.now();
  const existingAnswer = await SharedStandardAnswerModel.findOne({
    $or: [
      { normalizedCanonicalTitle: normalizedTitle },
      { aliases: normalizedTitle },
    ],
  });

  if (existingAnswer) {
    return {
      sharedAnswerId: existingAnswer._id.toString(),
      canonicalTitle: existingAnswer.canonicalTitle,
      normalizedCanonicalTitle: existingAnswer.normalizedCanonicalTitle,
      aliases: existingAnswer.aliases,
      answerContent: existingAnswer.answerContent,
      answerSource: "reused",
      durationMs: Date.now() - startedAt,
    };
  }

  const generated = await generateAnswerWithModel(title);
  const canonicalTitle = generated.canonicalTitle || title;
  const normalizedCanonicalTitle = normalizeTopicTitle(canonicalTitle);
  const aliases = normalizeAliases([
    title,
    canonicalTitle,
    normalizedTitle,
    ...generated.aliases,
  ]);

  const sharedAnswer = await SharedStandardAnswerModel.findOneAndUpdate(
    { canonicalTitle },
    {
      $set: {
        normalizedCanonicalTitle,
        aliases,
        answerContent: generated.answerContent,
        answerSource: "generated",
      },
      $setOnInsert: {
        answerVersion: 1,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
    },
  );

  if (!sharedAnswer) {
    throw new AppError(ANSWER_FAILURE_MESSAGE, 502);
  }

  return {
    sharedAnswerId: sharedAnswer._id.toString(),
    canonicalTitle: sharedAnswer.canonicalTitle,
    normalizedCanonicalTitle: sharedAnswer.normalizedCanonicalTitle,
    aliases: sharedAnswer.aliases,
    answerContent: sharedAnswer.answerContent,
    answerSource: "generated",
    durationMs: Date.now() - startedAt,
  };
}

export default resolveStandardAnswer;
