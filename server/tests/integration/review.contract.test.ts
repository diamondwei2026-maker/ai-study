import request from "supertest";

import KnowledgePointModel from "../../src/models/KnowledgePoint.js";
import ReviewAttemptModel from "../../src/models/ReviewAttempt.js";
import ReviewNodeModel from "../../src/models/ReviewNode.js";
import SharedStandardAnswerModel from "../../src/models/SharedStandardAnswer.js";
import { normalizeTopicTitle } from "../../src/services/answerService.js";
import { createInitialReviewNodes } from "../../src/services/reviewPlanService.js";
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

async function seedReviewFixture() {
  const user = await createUserFixture({ phone: "13800138110" });
  const accessToken = createAccessTokenFixture(user._id.toString());
  const canonicalTitle = "Vue3 响应式原理";
  const normalizedCanonicalTitle = normalizeTopicTitle(canonicalTitle);
  const sharedAnswer = await SharedStandardAnswerModel.create({
    canonicalTitle,
    normalizedCanonicalTitle,
    aliases: [normalizedCanonicalTitle],
    answerContent:
      "reactive system tracks dependencies and updates the view when state changes",
    answerSource: "generated",
    answerVersion: 1,
  });

  const knowledgePoint = await KnowledgePointModel.create({
    userId: user._id,
    title: canonicalTitle,
    normalizedTitle: normalizedCanonicalTitle,
    canonicalTitle,
    sharedAnswerId: sharedAnswer._id,
    source: "manualEntry",
    firstReviewAt: new Date(),
  });

  const baseDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const reviewNodes = await createInitialReviewNodes({
    userId: user._id,
    knowledgePointId: knowledgePoint._id,
    baseDate,
  });

  knowledgePoint.firstReviewAt = reviewNodes[0]!.dueAt;
  await knowledgePoint.save();

  const task = await ReviewNodeModel.findOne({
    userId: user._id,
    knowledgePointId: knowledgePoint._id,
  }).sort({ dueAt: 1, sequence: 1 });

  if (!task) {
    throw new Error("missing seeded review task");
  }

  return {
    user,
    accessToken,
    knowledgePoint,
    task,
  };
}

describe("review contract", () => {
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

  it("returns 401 when listing reviews without authentication", async () => {
    const response = await request(context.app)
      .get("/api/reviews/tasks")
      .expect(401);

    expect(response.body.message).toBe("未认证或登录已失效");
    expect(response.body.data).toBeNull();
  });

  it("returns review list and task detail for the current actionable node", async () => {
    const fixture = await seedReviewFixture();

    const listResponse = await request(context.app)
      .get("/api/reviews/tasks?tab=all")
      .set("Authorization", `Bearer ${fixture.accessToken}`)
      .expect(200);

    expect(listResponse.body.data.summary.overdueCount).toBe(1);
    expect(listResponse.body.data.reminderPolicy.maxOverdueReminders).toBe(2);
    expect(listResponse.body.data.tasks[0].taskId).toBe(
      fixture.task._id.toString(),
    );
    expect(listResponse.body.data.tasks[0].routeTarget).toContain(
      fixture.task._id.toString(),
    );

    const detailResponse = await request(context.app)
      .get(`/api/reviews/tasks/${fixture.task._id.toString()}`)
      .set("Authorization", `Bearer ${fixture.accessToken}`)
      .expect(200);

    expect(detailResponse.body.data.task.knowledgePointTitle).toBe(
      fixture.knowledgePoint.title,
    );
    expect(detailResponse.body.data.task.status).toBe("overdue");
    expect(detailResponse.body.data.task.overdueLevel).toBe("short");
  });

  it("submits a feynman review and returns follow-up nodes", async () => {
    process.env.OPENROUTER_MOCK = "true";

    const fixture = await seedReviewFixture();
    const response = await request(context.app)
      .post(`/api/reviews/tasks/${fixture.task._id.toString()}/submit`)
      .set("Authorization", `Bearer ${fixture.accessToken}`)
      .send({
        content:
          "reactive system updates the view, but dependency tracking is still unclear",
      })
      .expect(200);

    expect(response.body.message).toBe("review completed");
    expect(response.body.data.result.judgment).toBe("FUZZY");
    expect(response.body.data.result.planAdjustmentKey).toBe(
      "SHORT_OVERDUE_FUZZY_ROLLBACK_REINFORCE",
    );
    expect(response.body.data.followUpNodes[0].nodeType).toBe("reinforcement");
    expect(response.body.data.taskUpdate.nextDueAt).toBe(
      response.body.data.followUpNodes[0].dueAt,
    );

    const completedTask = await ReviewNodeModel.findById(fixture.task._id);
    const attemptCount = await ReviewAttemptModel.countDocuments({
      reviewNodeId: fixture.task._id,
    });

    expect(completedTask?.status).toBe("completed");
    expect(attemptCount).toBe(1);
  });

  it("returns 502 when AI evaluation is unavailable", async () => {
    const fixture = await seedReviewFixture();

    const response = await request(context.app)
      .post(`/api/reviews/tasks/${fixture.task._id.toString()}/submit`)
      .set("Authorization", `Bearer ${fixture.accessToken}`)
      .send({
        content: "reactive system updates the view when state changes",
      })
      .expect(502);

    expect(response.body.message).toBe("AI 判定失败，请稍后重试");
    expect(response.body.data.draftRetained).toBe(true);
    expect(await ReviewAttemptModel.countDocuments()).toBe(0);
  });
});
