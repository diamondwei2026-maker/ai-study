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

describe("auth session", () => {
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

  it("logs in with verification code", async () => {
    await createUserFixture({ phone: "13800138000" });
    await createVerificationCodeFixture({
      phone: "13800138000",
      type: "login",
      code: "123456",
    });

    const response = await request(context.app)
      .post("/api/auth/login")
      .send({ phone: "13800138000", code: "123456" })
      .expect(200);

    expect(response.body.data.accessToken).toBeTruthy();
    expect(response.body.data.refreshToken).toBeTruthy();
  });

  it("logs in with password", async () => {
    await createUserFixture({ phone: "13800138000", password: "Pass1234" });

    const response = await request(context.app)
      .post("/api/auth/login")
      .send({ phone: "13800138000", password: "Pass1234" })
      .expect(200);

    expect(response.body.data.user.nickname).toBe("用户8000");
  });

  it("locks account after five consecutive password failures", async () => {
    const user = await createUserFixture({
      phone: "13800138000",
      password: "Pass1234",
    });

    for (let index = 0; index < 4; index += 1) {
      await request(context.app)
        .post("/api/auth/login")
        .send({ phone: "13800138000", password: "Wrong1234" })
        .expect(400);
    }

    const response = await request(context.app)
      .post("/api/auth/login")
      .send({ phone: "13800138000", password: "Wrong1234" })
      .expect(403);

    const updatedUser = await UserModel.findById(user._id);
    expect(response.body.data.lockedUntil).toBeTruthy();
    expect(updatedUser?.status).toBe("locked");
  });

  it("refreshes access token and validates protected profile requests", async () => {
    await createUserFixture({ phone: "13800138000", password: "Pass1234" });

    const loginResponse = await request(context.app)
      .post("/api/auth/login")
      .send({ phone: "13800138000", password: "Pass1234" })
      .expect(200);

    const refreshResponse = await request(context.app)
      .post("/api/auth/refresh")
      .send({ refreshToken: loginResponse.body.data.refreshToken })
      .expect(200);

    await request(context.app)
      .get("/api/user/profile")
      .set("Authorization", `Bearer ${refreshResponse.body.data.accessToken}`)
      .expect(200);

    await request(context.app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "invalid-token" })
      .expect(401);
  });

  it("invalidates refresh token after logout", async () => {
    await createUserFixture({ phone: "13800138000", password: "Pass1234" });

    const loginResponse = await request(context.app)
      .post("/api/auth/login")
      .send({ phone: "13800138000", password: "Pass1234" })
      .expect(200);

    await request(context.app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .send({ refreshToken: loginResponse.body.data.refreshToken })
      .expect(200);

    await request(context.app)
      .post("/api/auth/refresh")
      .send({ refreshToken: loginResponse.body.data.refreshToken })
      .expect(401);
  });
});
