import type { Response } from "express";

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T | null;
}

export class AppError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message: string, statusCode = 400, data?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

export function sendSuccess<T>(
  response: Response,
  data: T | null = null,
  message = "success",
  code = 200,
) {
  return response.status(code).json({
    code,
    message,
    data,
  } satisfies ApiEnvelope<T>);
}

export function sendFail(
  response: Response,
  message: string,
  code = 400,
  data: unknown = null,
) {
  return response.status(code).json({
    code,
    message,
    data,
  } satisfies ApiEnvelope<unknown>);
}
