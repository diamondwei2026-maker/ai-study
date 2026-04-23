import type { ReviewReminderPolicy, ReviewTaskListItem } from "@/types/review";
import {
  consumePendingReviewNavigation,
  rebuildReviewReminderMetadata,
  syncReviewReminderMetadata,
} from "@/utils/notification";

export function useReviewNotifications() {
  async function syncNotifications(
    tasks: ReviewTaskListItem[],
    policy: ReviewReminderPolicy,
  ) {
    return syncReviewReminderMetadata(tasks, policy);
  }

  async function rebuildNotifications() {
    return rebuildReviewReminderMetadata();
  }

  function consumePendingTarget() {
    return consumePendingReviewNavigation();
  }

  return {
    syncNotifications,
    rebuildNotifications,
    consumePendingTarget,
  };
}

export default useReviewNotifications;
