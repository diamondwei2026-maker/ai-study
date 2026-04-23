<script setup lang="ts">
import { onLaunch, onShow } from "@dcloudio/uni-app";

import { useUserStore } from "@/stores/user";
import { pinia } from "@/stores";
import { request } from "@/utils/request";

const userStore = useUserStore(pinia);

function currentRoute() {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return currentPage?.route ? `/${currentPage.route}` : "";
}

async function restoreSession() {
  userStore.loadFromStorage();
  if (!userStore.hasSession) {
    return;
  }

  try {
    const profile = await request<{
      id: string;
      phone: string;
      nickname: string;
      avatar: string | null;
      createdAt: string;
    }>({
      url: "/user/profile",
    });

    userStore.patchUserInfo(profile.data);

    if (currentRoute() === "/pages/login/index") {
      uni.reLaunch({ url: "/pages/mine/index" });
    }
  } catch {
    if (
      !userStore.hasSession &&
      currentRoute() &&
      currentRoute() !== "/pages/login/index"
    ) {
      uni.reLaunch({ url: "/pages/login/index" });
    }
  }
}

onLaunch(() => {
  void restoreSession();
});

onShow(() => {
  void restoreSession();
});
</script>

<style>
:root,
page {
  --page-bg: #f3f1ff;
  --surface-card: #ffffff;
  --text-primary: #1d1a3b;
  --text-secondary: #817da6;
  --border-subtle: #d9d6f2;
  --brand-primary: #5b45f5;
  --brand-secondary: #8e42ff;
  --brand-panel: rgba(255, 255, 255, 0.12);
  --danger-surface: #fff4f3;
  --danger-text: #f04949;
  --on-brand: #ffffff;
  --on-brand-muted: rgba(255, 255, 255, 0.74);
  --shadow-card: 0 16rpx 48rpx rgba(72, 56, 164, 0.14);
  --shadow-fab: 0 18rpx 40rpx rgba(91, 69, 245, 0.28);
  background: var(--page-bg);
  color: var(--text-primary);
  font-family: "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif;
}

view,
text,
button,
input {
  box-sizing: border-box;
}

button::after {
  border: 0;
}
</style>
