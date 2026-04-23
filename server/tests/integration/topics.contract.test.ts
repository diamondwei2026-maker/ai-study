import request from "supertest";

import KnowledgePointModel from "../../src/models/KnowledgePoint.js";
import ReviewNodeModel from "../../src/models/ReviewNode.js";
import SharedStandardAnswerModel from "../../src/models/SharedStandardAnswer.js";
import { normalizeTopicTitle } from "../../src/services/answerService.js";
import {
  createAccessTokenFixture,
  createUserFixture,
} from "../helpers/fixtures.js";
import {
  clearDatabase,
  setupTestApp,
  teardownTestApp,
  type TestAppContext,
} from "../helpers/testApp.js";

describe("topics contract", () => {
  let context: TestAppContext;

  beforeAll(async () => {
    context = await setupTestApp();
  }, 300000);

  afterEach(async () => {
    await clearDatabase();
    process.env.OPENROUTER_MOCK = "false";
    delete process.env.OPENROUTER_MODEL;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterAll(async () => {
    await teardownTestApp(context);
  }, 300000);

  it("returns 401 when the request is unauthenticated", async () => {
    const response = await request(context.app)
      .post("/api/topics")
      .send({ title: "牛顿第二定律" })
      .expect(401);

    expect(response.body.message).toBe("未认证或登录已失效");
    expect(response.body.data).toBeNull();
  });

  it("creates a topic by reusing a shared standard answer", async () => {
    const user = await createUserFixture({ phone: "13800138010" });
    const accessToken = createAccessTokenFixture(user._id.toString());
    const normalizedTitle = normalizeTopicTitle("牛顿第二定律");

    await SharedStandardAnswerModel.create({
      canonicalTitle: "牛顿第二定律",
      normalizedCanonicalTitle: normalizedTitle,
      aliases: [normalizedTitle],
      answerContent: "物体所受合外力等于质量乘以加速度。",
      answerSource: "generated",
      answerVersion: 1,
    });

    const response = await request(context.app)
      .post("/api/topics")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "牛顿第二定律" })
      .expect(200);

    expect(response.body.message).toBe("知识点创建成功");
    expect(response.body.data.standardAnswer.source).toBe("reused");
    expect(response.body.data.reviewPlan.totalNodes).toBe(6);
    expect(response.body.data.reviewPlan.nodes).toHaveLength(6);
    expect(response.body.data.reviewPlan.nextDueAt).toBe(
      response.body.data.reviewPlan.nodes[0].dueAt,
    );
    expect(response.body.data.knowledgePoint.firstReviewAt).toBe(
      response.body.data.reviewPlan.nextDueAt,
    );

    const knowledgePoint = await KnowledgePointModel.findOne({
      userId: user._id,
    });
    const reviewNodeCount = await ReviewNodeModel.countDocuments({
      userId: user._id,
      knowledgePointId: knowledgePoint?._id,
    });

    expect(knowledgePoint?.canonicalTitle).toBe("牛顿第二定律");
    expect(reviewNodeCount).toBe(6);
  });

  it("creates a topic by generating a new shared standard answer", async () => {
    process.env.OPENROUTER_MOCK = "true";

    const user = await createUserFixture({ phone: "13800138011" });
    const accessToken = createAccessTokenFixture(user._id.toString());

    const response = await request(context.app)
      .post("/api/topics")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "费曼学习法" })
      .expect(200);

    expect(response.body.data.standardAnswer.source).toBe("generated");
    expect(response.body.data.standardAnswer.canonicalTitle).toBe("费曼学习法");

    const sharedAnswer = await SharedStandardAnswerModel.findOne({
      canonicalTitle: "费曼学习法",
    });

    expect(sharedAnswer?.answerContent).toContain("费曼学习法");
  });

  it("returns 409 when the user already owns the same topic", async () => {
    const user = await createUserFixture({ phone: "13800138012" });
    const accessToken = createAccessTokenFixture(user._id.toString());
    const normalizedTitle = normalizeTopicTitle("牛顿第二定律");
    const sharedAnswer = await SharedStandardAnswerModel.create({
      canonicalTitle: "牛顿第二定律",
      normalizedCanonicalTitle: normalizedTitle,
      aliases: [normalizedTitle],
      answerContent: "物体所受合外力等于质量乘以加速度。",
      answerSource: "generated",
      answerVersion: 1,
    });
    const existingKnowledgePoint = await KnowledgePointModel.create({
      userId: user._id,
      title: "牛顿第二定律",
      normalizedTitle,
      canonicalTitle: "牛顿第二定律",
      sharedAnswerId: sharedAnswer._id,
      source: "manualEntry",
      firstReviewAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const response = await request(context.app)
      .post("/api/topics")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "牛顿第二定律" })
      .expect(409);

    expect(response.body.message).toBe("已存在相同或相近知识点");
    expect(response.body.data.existingKnowledgePoint.id).toBe(
      existingKnowledgePoint._id.toString(),
    );
  });

  it("returns 502 when answer generation cannot start", async () => {
    const user = await createUserFixture({ phone: "13800138013" });
    const accessToken = createAccessTokenFixture(user._id.toString());

    const response = await request(context.app)
      .post("/api/topics")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "布朗运动" })
      .expect(502);

    expect(response.body.message).toBe("标准答案生成失败，请稍后重试");
    expect(await KnowledgePointModel.countDocuments({ userId: user._id })).toBe(
      0,
    );
    expect(await ReviewNodeModel.countDocuments({ userId: user._id })).toBe(0);
  });
});
