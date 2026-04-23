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
  --text-tertiary: #a39fbc;
  --border-subtle: #d9d6f2;
  --brand-primary: #5b45f5;
  --brand-secondary: #8e42ff;
  --brand-panel: rgba(255, 255, 255, 0.12);
  --danger-surface: #fff4f3;
  --danger-text: #f04949;
  --home-signal: #ffb9ac;
  --home-banner-bg: #fff3e8;
  --home-banner-border: #f2c494;
  --home-banner-text: #ef7f35;
  --home-banner-muted: #ba7f48;
  --home-banner-pill: #ffe2bf;
  --on-brand: #ffffff;
  --on-brand-muted: rgba(255, 255, 255, 0.74);
  --topic-shell: #f7f5ff;
  --topic-card-border: #e7e4fb;
  --topic-input-bg: #fafafe;
  --topic-muted: #8d87ad;
  --topic-hint: #b5afc9;
  --topic-notice-bg: #f4f7ff;
  --topic-notice-border: #c5d4ff;
  --topic-notice-text: #5d65d6;
  --review-hero-top: #ffe9c8;
  --review-hero-bottom: #fff7ea;
  --review-panel: #fff8f0;
  --review-panel-border: #f2dbc4;
  --review-accent: #eb7a2e;
  --review-accent-soft: #ffe5c2;
  --review-input-bg: #fffdf8;
  --review-short: #f7aa5d;
  --review-medium: #f48656;
  --review-long: #ea5656;
  --review-banner-bg: #fff2de;
  --review-banner-border: #ffd1a5;
  --review-mask: rgba(27, 22, 62, 0.42);
  --topic-disabled-bg: #e3e7ef;
  --topic-disabled-text: #7f8797;
  --topic-footer-surface: rgba(255, 255, 255, 0.96);
  --topic-success-bg: #eaf8ef;
  --topic-success-text: #2f8559;
  --shadow-card: 0 16rpx 48rpx rgba(72, 56, 164, 0.14);
  --shadow-fab: 0 18rpx 40rpx rgba(91, 69, 245, 0.28);
  --shadow-hero: 0 26rpx 80rpx rgba(77, 56, 186, 0.22);
  --shadow-topic-card: 0 16rpx 52rpx rgba(74, 63, 140, 0.08);
  --shadow-topic-footer: 0 -10rpx 36rpx rgba(58, 49, 123, 0.08);
  --shadow-review-panel: 0 18rpx 56rpx rgba(127, 94, 38, 0.12);
  --shadow-review-sheet: 0 -18rpx 72rpx rgba(37, 28, 85, 0.18);
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
