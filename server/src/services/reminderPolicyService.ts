import type { ReviewNodeDocument } from "../models/ReviewNode.js";

export interface ReminderPolicySummary {
  preDueMinutes: number;
  overdueReminderMinutes: [number, number];
  maxOverdueReminders: number;
}

const PRE_DUE_MINUTES = 30;
const OVERDUE_REMINDER_MINUTES = [60, 1440] as const;
const MAX_OVERDUE_REMINDERS = 2;

function addMinutes(baseDate: Date, offsetMinutes: number) {
  return new Date(baseDate.getTime() + offsetMinutes * 60 * 1000);
}

export function getReminderPolicySummary(): ReminderPolicySummary {
  return {
    preDueMinutes: PRE_DUE_MINUTES,
    overdueReminderMinutes: [...OVERDUE_REMINDER_MINUTES],
    maxOverdueReminders: MAX_OVERDUE_REMINDERS,
  };
}

export function getNextReminderAt(
  node: Pick<
    ReviewNodeDocument,
    "dueAt" | "status" | "overdueReminderSentCount"
  >,
  referenceDate = new Date(),
) {
  if (node.status === "completed") {
    return null;
  }

  const candidates = [addMinutes(node.dueAt, -PRE_DUE_MINUTES)];

  OVERDUE_REMINDER_MINUTES.forEach((offsetMinutes, index) => {
    if (index >= node.overdueReminderSentCount) {
      candidates.push(addMinutes(node.dueAt, offsetMinutes));
    }
  });

  return (
    candidates
      .filter((candidate) => candidate.getTime() > referenceDate.getTime())
      .sort((left, right) => left.getTime() - right.getTime())[0] ?? null
  );
}

export default getReminderPolicySummary;
