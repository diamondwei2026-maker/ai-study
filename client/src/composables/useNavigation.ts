import { pinia } from "@/stores";
import { useHomeStore } from "@/stores/home";
import type {
  HomeActionEventPayload,
  HomeGuidanceSuggestion,
  PrimaryActionEntry,
} from "@/types/home";
import { request } from "@/utils/request";

function showMessage(message: string) {
  uni.showToast({
    title: message,
    icon: "none",
    duration: 2200,
  });
}

function resolveRoute(action: PrimaryActionEntry) {
  return action.key === "createTopic"
    ? "/pages/topic-entry/index"
    : "/pages/review/index";
}

function navigateTo(url: string) {
  return new Promise<void>((resolve, reject) => {
    uni.navigateTo({
      url,
      success: () => resolve(),
      fail: (error) => reject(error),
    });
  });
}

async function recordActionEvent(payload: HomeActionEventPayload) {
  try {
    await request<null, Record<string, unknown>>({
      url: "/home/action-events",
      method: "POST",
      data: payload as unknown as Record<string, unknown>,
    });
  } catch {
    // 埋点失败不阻塞主流程
  }
}

export function useNavigation() {
  const homeStore = useHomeStore(pinia);

  async function openAction(
    action: PrimaryActionEntry,
    guidance?: HomeGuidanceSuggestion,
  ) {
    const route = resolveRoute(action);
    const payloadBase = {
      actionKey: guidance ? "guidanceAction" : action.key,
      targetModule: action.targetModule,
      guidanceType: guidance?.type,
    } as const;

    if (!action.enabled) {
      showMessage(action.disabledReason ?? "当前操作暂不可用");
      await recordActionEvent({
        ...payloadBase,
        result: "blocked",
      });
      return false;
    }

    try {
      await navigateTo(route);
      homeStore.setLastActionContext(action.key, action.targetModule);
      homeStore.markRefreshNeeded();
      await recordActionEvent({
        ...payloadBase,
        result: "success",
      });
      return true;
    } catch {
      await recordActionEvent({
        ...payloadBase,
        result: "failed",
      });
      showMessage("目标页面暂不可用，请稍后重试");
      return false;
    }
  }

  return {
    openAction,
  };
}

export default useNavigation;