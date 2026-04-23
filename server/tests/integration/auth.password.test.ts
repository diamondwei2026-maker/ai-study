import request from "supertest";

import {
  createAccessTokenFixture,
  createVerificationCodeFixture,
  createUserFixture,
  getSecurityLogs,
} from "../helpers/fixtures.js";
import {
  clearDatabase,
  setupTestApp,
  teardownTestApp,
  type TestAppContext,
} from "../helpers/testApp.js";

describe("auth password", () => {
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

  it("sets password for a first-time user", async () => {
    const user = await createUserFixture({
      phone: "13800138000",
      password: null,
    });
    const accessToken = createAccessTokenFixture(user._id.toString());

    await request(context.app)
      .post("/api/auth/password/set")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: "Pass1234" })
      .expect(200);

    const logs = await getSecurityLogs("passwordSet");
    expect(logs).toHaveLength(1);
  });

  it("changes password and allows login with the new password", async () => {
    const user = await createUserFixture({
      phone: "13800138000",
      password: "Pass1234",
    });
    const accessToken = createAccessTokenFixture(user._id.toString());

    await request(context.app)
      .post("/api/auth/password/change")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldPassword: "Pass1234", newPassword: "NewPass123" })
      .expect(200);

    await request(context.app)
      .post("/api/auth/login")
      .send({ phone: "13800138000", password: "NewPass123" })
      .expect(200);

    const logs = await getSecurityLogs("passwordChange");
    expect(logs).toHaveLength(1);
  });

  it("resets password with verification code and writes security log", async () => {
    await createUserFixture({ phone: "13800138000", password: "Pass1234" });
    await createVerificationCodeFixture({
      phone: "13800138000",
      type: "resetPassword",
      code: "654321",
    });

    await request(context.app)
      .post("/api/auth/password/reset")
      .send({ phone: "13800138000", code: "654321", newPassword: "Reset1234" })
      .expect(200);

    await request(context.app)
      .post("/api/auth/login")
      .send({ phone: "13800138000", password: "Reset1234" })
      .expect(200);

    const logs = await getSecurityLogs("passwordReset");
    expect(logs).toHaveLength(1);
  });
});
