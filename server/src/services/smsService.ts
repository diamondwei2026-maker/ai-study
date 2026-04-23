import type { VerificationCodeType } from "../models/VerificationCode.js";

export interface SendSmsInput {
  phone: string;
  code: string;
  type: VerificationCodeType;
}

export interface SmsSendResult {
  delivered: boolean;
  debugCode?: string;
}

export interface ISmsService {
  sendCode(input: SendSmsInput): Promise<SmsSendResult>;
}

class MockSmsService implements ISmsService {
  private readonly store = new Map<string, { code: string; sentAt: Date }>();

  async sendCode(input: SendSmsInput) {
    this.store.set(this.getKey(input.phone, input.type), {
      code: input.code,
      sentAt: new Date(),
    });

    return {
      delivered: true,
      debugCode: input.code,
    } satisfies SmsSendResult;
  }

  getLastCode(phone: string, type: VerificationCodeType) {
    return this.store.get(this.getKey(phone, type));
  }

  private getKey(phone: string, type: VerificationCodeType) {
    return `${phone}:${type}`;
  }
}

export const smsService = new MockSmsService();

export default smsService;
