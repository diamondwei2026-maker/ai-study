import request from "supertest";

import HomeActionEventModel from "../../src/models/HomeActionEvent.js";
import {
  createAccessTokenFixture,
  createReviewTaskFixture,
  createUserFixture,
} from "../helpers/fixtures.js";
import {
  clearDatabase,
  setupTestApp,
  teardownTestApp,
  type TestAppContext,
} from "../helpers/testApp.js";

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

    await createReviewTaskFixture({
      userId: user._id.toString(),
      title: "过期任务",
      dueAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      overdueCount: 3,
    });
    await createReviewTaskFixture({
      userId: user._id.toString(),
      title: "今日待复习",
      dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
    await createReviewTaskFixture({
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