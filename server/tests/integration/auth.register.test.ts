import request from "supertest";

import UserModel from "../../src/models/User.js";
import {
  createVerificationCodeFixture,
  createUserFixture,
} from "../helpers/fixtures.js";
import {
  clearDatabase,
  setupTestApp,
  teardownTestApp,
  type TestAppContext,
} from "../helpers/testApp.js";

describe("auth register", () => {
  let context: TestAppContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it("registers a new user with a valid code", async () => {
    await createVerificationCodeFixture({
      phone: "13800138000",
      type: "register",
      code: "123456",
    });

    const response = await request(context.app)
      .post("/api/auth/register")
      .send({ phone: "13800138000", code: "123456" })
      .expect(200);

    expect(response.body.data.user.phone).toBe("138****8000");
    expect(response.body.data.accessToken).toBeTruthy();
    expect(await UserModel.findOne({ phone: "13800138000" })).not.toBeNull();
  });

  it("rejects invalid phone format when sending code", async () => {
    const response = await request(context.app)
      .post("/api/auth/send-code")
      .send({ phone: "123", type: "register" })
      .expect(400);

    expect(response.body.message).toBe("请求参数错误");
  });

  it("rejects duplicate registration", async () => {
    await createUserFixture({ phone: "13800138000" });
    await createVerificationCodeFixture({
      phone: "13800138000",
      type: "register",
      code: "123456",
    });

    const response = await request(context.app)
      .post("/api/auth/register")
      .send({ phone: "13800138000", code: "123456" })
      .expect(400);

    expect(response.body.message).toBe("手机号已注册");
  });

  it("rejects expired verification code", async () => {
    await createVerificationCodeFixture({
      phone: "13800138000",
      type: "register",
      code: "123456",
      expiresAt: new Date(Date.now() - 1000),
    });

    const response = await request(context.app)
      .post("/api/auth/register")
      .send({ phone: "13800138000", code: "123456" })
      .expect(400);

    expect(response.body.message).toBe("验证码无效或已过期");
  });

  it("rate limits repeated send-code requests within 60 seconds", async () => {
    await request(context.app)
      .post("/api/auth/send-code")
      .send({ phone: "13800138000", type: "register" })
      .expect(200);

    const response = await request(context.app)
      .post("/api/auth/send-code")
      .send({ phone: "13800138000", type: "register" })
      .expect(429);

    expect(response.body.message).toBe("请求过于频繁，请稍后再试");
  });
});
