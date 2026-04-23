import request from "supertest";

import HomeActionEventModel from "../../src/models/HomeActionEvent.js";
import KnowledgePointModel from "../../src/models/KnowledgePoint.js";
import ReviewNodeModel from "../../src/models/ReviewNode.js";
import SharedStandardAnswerModel from "../../src/models/SharedStandardAnswer.js";
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

async function createHomeReviewNodeFixture(input: {
  userId: string;
  title: string;
  dueAt: Date;
  status?: "pending" | "completed";
  completedAt?: Date | null;
}) {
  const normalizedTitle = input.title.toLowerCase();
  const sharedAnswer = await SharedStandardAnswerModel.create({
    canonicalTitle: input.title,
    normalizedCanonicalTitle: normalizedTitle,
    aliases: [normalizedTitle],
    answerContent: `${input.title} 的标准答案`,
    answerSource: "generated",
    answerVersion: 1,
  });

  const knowledgePoint = await KnowledgePointModel.create({
    userId: input.userId,
    title: input.title,
    normalizedTitle,
    canonicalTitle: input.title,
    sharedAnswerId: sharedAnswer._id,
    source: "manualEntry",
    firstReviewAt: input.dueAt,
  });

  return ReviewNodeModel.create({
    userId: input.userId,
    knowledgePointId: knowledgePoint._id,
    sequence: 1,
    offsetCode: "H1",
    offsetMinutes: 60,
    nodeType: "initial",
    sourceNodeId: null,
    dueAt: input.dueAt,
    status: input.status ?? "pending",
    overdueLevel: null,
    overdueAt: null,
    wasOverdue: false,
    overdueReminderSentCount: 0,
    completedAt: input.completedAt ?? null,
    nextDueAt: null,
  });
}

describe("home dashboard", () => {
  let context: TestAppContext;

  beforeAll(async () => {
    context = await setupTestApp();
  }, 300000);

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  }, 300000);

  it("returns overdue-first dashboard summary for authenticated users", async () => {
    const user = await createUserFixture({ phone: "13800138001" });
    const accessToken = createAccessTokenFixture(user._id.toString());

    await createHomeReviewNodeFixture({
      userId: user._id.toString(),
      title: "过期任务",
      dueAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });
    await createHomeReviewNodeFixture({
      userId: user._id.toString(),
      title: "今日待复习",
      dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
    await createHomeReviewNodeFixture({
      userId: user._id.toString(),
      title: "已完成任务",
      dueAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      status: "completed",
      completedAt: new Date(),
    });

    const response = await request(context.app)
      .get("/api/home/dashboard")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.reviewStatus.statusKind).toBe("OVERDUE");
    expect(response.body.data.reviewStatus.pendingCount).toBe(2);
    expect(response.body.data.reviewStatus.overdueCount).toBe(1);
    expect(response.body.data.reviewStatus.completedToday).toBe(1);
    expect(response.body.data.primaryActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "startReview",
          enabled: true,
        }),
        expect.objectContaining({
          key: "createTopic",
          enabled: true,
        }),
      ]),
    );
    expect(response.body.data.guidance.suggestedActionKey).toBe("startReview");
  });

  it("returns empty state and disables review action when no pending tasks exist", async () => {
    const user = await createUserFixture({ phone: "13800138002" });
    const accessToken = createAccessTokenFixture(user._id.toString());

    const response = await request(context.app)
      .get("/api/home/dashboard")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.reviewStatus.statusKind).toBe("EMPTY");
    expect(response.body.data.primaryActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "startReview",
          enabled: false,
        }),
      ]),
    );
    expect(response.body.data.guidance.suggestedActionKey).toBe("createTopic");
  });

  it("records home action events", async () => {
    const user = await createUserFixture({ phone: "13800138003" });
    const accessToken = createAccessTokenFixture(user._id.toString());

    await request(context.app)
      .post("/api/home/action-events")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        actionKey: "startReview",
        targetModule: "review.start",
        guidanceType: "REVIEW_NOW",
        result: "success",
        deviceInfo: "vitest-device",
      })
      .expect(200);

    const event = await HomeActionEventModel.findOne({
      userId: user._id,
      actionKey: "startReview",
    });

    expect(event?.targetModule).toBe("review.start");
    expect(event?.guidanceType).toBe("REVIEW_NOW");
    expect(event?.result).toBe("success");
  });
});
