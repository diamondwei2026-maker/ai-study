import request from "supertest";

import UserModel from "../../src/models/User.js";
import { createUserFixture } from "../helpers/fixtures.js";
import {
  clearDatabase,
  setupTestApp,
  teardownTestApp,
  type TestAppContext,
} from "../helpers/testApp.js";

const PNG_FIXTURE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgAq0x4QAAAAASUVORK5CYII=",
  "base64",
);

describe("user profile isolation", () => {
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

  async function login(phone: string, password: string) {
    const response = await request(context.app)
      .post("/api/auth/login")
      .send({ phone, password })
      .expect(200);

    return response.body.data.accessToken as string;
  }

  it("returns current user's profile", async () => {
    await createUserFixture({
      phone: "13800138000",
      password: "Pass1234",
      nickname: "小王",
    });
    const accessToken = await login("13800138000", "Pass1234");

    const response = await request(context.app)
      .get("/api/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.nickname).toBe("小王");
    expect(response.body.data.phone).toBe("138****8000");
  });

  it("updates nickname and avatar for the authenticated user", async () => {
    const user = await createUserFixture({
      phone: "13800138000",
      password: "Pass1234",
    });
    const accessToken = await login("13800138000", "Pass1234");

    await request(context.app)
      .put("/api/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nickname: "新的昵称" })
      .expect(200);

    await request(context.app)
      .post("/api/user/avatar")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", PNG_FIXTURE, "avatar.png")
      .expect(200);

    const updatedUser = await UserModel.findById(user._id);
    expect(updatedUser?.nickname).toBe("新的昵称");
    expect(updatedUser?.avatar).toMatch(/^\/uploads\/avatars\//);
  });

  it("ignores forged userId input and keeps user data isolated", async () => {
    const userA = await createUserFixture({
      phone: "13800138000",
      password: "Pass1234",
      nickname: "用户A",
    });
    const userB = await createUserFixture({
      phone: "13800138001",
      password: "Pass1234",
      nickname: "用户B",
    });
    const accessToken = await login("13800138000", "Pass1234");

    await request(context.app)
      .put("/api/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nickname: "被篡改的昵称", userId: userB._id.toString() })
      .expect(200);

    const freshUserA = await UserModel.findById(userA._id);
    const freshUserB = await UserModel.findById(userB._id);

    expect(freshUserA?.nickname).toBe("被篡改的昵称");
    expect(freshUserB?.nickname).toBe("用户B");
  });
});
