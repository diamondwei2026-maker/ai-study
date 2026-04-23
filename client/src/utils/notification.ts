import type {
  ReviewReminderKind,
  ReviewReminderMetadata,
  ReviewReminderPolicy,
  ReviewTaskListItem,
} from "@/types/review";

const REMINDER_STORAGE_KEY = "ai-study:review-reminders";
const PENDING_TARGET_STORAGE_KEY = "ai-study:review-pending-target";

function createReminderId(
  reviewNodeId: string,
  reminderKind: ReviewReminderKind,
) {
  return `${reviewNodeId}:${reminderKind}`;
}

function readReminderStorage() {
  const snapshot = uni.getStorageSync(REMINDER_STORAGE_KEY) as
    | ReviewReminderMetadata[]
    | ""
    | null;

  return Array.isArray(snapshot) ? snapshot : [];
}

function writeReminderStorage(reminders: ReviewReminderMetadata[]) {
  uni.setStorageSync(REMINDER_STORAGE_KEY, reminders);
}

function addMinutes(dateString: string, offsetMinutes: number) {
  return new Date(new Date(dateString).getTime() + offsetMinutes * 60 * 1000);
}

function buildDesiredReminders(
  task: ReviewTaskListItem,
  policy: ReviewReminderPolicy,
  referenceDate: Date,
) {
  const reminderSpecs: Array<{
    reminderKind: ReviewReminderKind;
    scheduledFor: Date;
  }> = [
    {
      reminderKind: "pre_due",
      scheduledFor: addMinutes(task.dueAt, -policy.preDueMinutes),
    },
    {
      reminderKind: "overdue_1h",
      scheduledFor: addMinutes(task.dueAt, policy.overdueReminderMinutes[0]),
    },
    {
      reminderKind: "overdue_24h",
      scheduledFor: addMinutes(task.dueAt, policy.overdueReminderMinutes[1]),
    },
  ];

  const nowIso = referenceDate.toISOString();

  return reminderSpecs.map(({ reminderKind, scheduledFor }) => ({
    localReminderId: createReminderId(task.taskId, reminderKind),
    reviewNodeId: task.taskId,
    reminderKind,
    scheduledFor: scheduledFor.toISOString(),
    notificationStatus:
      scheduledFor.getTime() > referenceDate.getTime()
        ? "scheduled"
        : "skipped",
    routeTarget: task.routeTarget,
    createdAt: nowIso,
    updatedAt: nowIso,
  })) satisfies ReviewReminderMetadata[];
}

export function loadReviewReminderMetadata() {
  return readReminderStorage();
}

export function rebuildReviewReminderMetadata(referenceDate = new Date()) {
  const nextReminders = readReminderStorage().map((reminder) => {
    if (
      reminder.notificationStatus === "scheduled" &&
      new Date(reminder.scheduledFor).getTime() <= referenceDate.getTime()
    ) {
      return {
        ...reminder,
        notificationStatus: "skipped" as const,
        updatedAt: referenceDate.toISOString(),
      };
    }

    return reminder;
  });

  writeReminderStorage(nextReminders);
  return nextReminders;
}

export function syncReviewReminderMetadata(
  tasks: ReviewTaskListItem[],
  policy: ReviewReminderPolicy,
  referenceDate = new Date(),
) {
  const previousReminders = readReminderStorage();
  const previousMap = new Map(
    previousReminders.map((reminder) => [reminder.localReminderId, reminder]),
  );
  const activeTaskIds = new Set(tasks.map((task) => task.taskId));
  const nextReminders: ReviewReminderMetadata[] = [];
  const nextIds = new Set<string>();

  tasks.forEach((task) => {
    buildDesiredReminders(task, policy, referenceDate).forEach((reminder) => {
      const previousReminder = previousMap.get(reminder.localReminderId);
      nextIds.add(reminder.localReminderId);
      nextReminders.push({
        ...reminder,
        createdAt: previousReminder?.createdAt ?? reminder.createdAt,
        updatedAt: referenceDate.toISOString(),
      });
    });
  });

  previousReminders.forEach((reminder) => {
    if (nextIds.has(reminder.localReminderId)) {
      return;
    }

    nextReminders.push({
      ...reminder,
      notificationStatus:
        activeTaskIds.has(reminder.reviewNodeId) &&
        reminder.notificationStatus === "sent"
          ? "sent"
          : "canceled",
      updatedAt: referenceDate.toISOString(),
    });
  });

  const orderedReminders = nextReminders.sort(
    (left, right) =>
      new Date(left.scheduledFor).getTime() -
      new Date(right.scheduledFor).getTime(),
  );

  writeReminderStorage(orderedReminders);
  return orderedReminders;
}

export function cancelReviewReminderMetadata(reviewNodeId: string) {
  const nextReminders = readReminderStorage().map((reminder) =>
    reminder.reviewNodeId === reviewNodeId
      ? {
          ...reminder,
          notificationStatus: "canceled" as const,
          updatedAt: new Date().toISOString(),
        }
      : reminder,
  );

  writeReminderStorage(nextReminders);
  return nextReminders;
}

export function registerPendingReviewNavigation(routeTarget: string) {
  uni.setStorageSync(PENDING_TARGET_STORAGE_KEY, routeTarget);
}

export function consumePendingReviewNavigation() {
  const routeTarget = uni.getStorageSync(PENDING_TARGET_STORAGE_KEY) as string;

  if (!routeTarget) {
    return null;
  }

  uni.removeStorageSync(PENDING_TARGET_STORAGE_KEY);
  return routeTarget;
}
