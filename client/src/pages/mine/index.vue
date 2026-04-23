<script setup lang="ts">
import { ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";

import { useAuth } from "@/composables/useAuth";
import { useProfile } from "@/composables/useProfile";
import { pinia } from "@/stores";
import { useUserStore } from "@/stores/user";
import AppTabBar from "@/components/shared/navigation/AppTabBar.vue";
import KnowledgeEntryFab from "@/components/shared/navigation/KnowledgeEntryFab.vue";

const userStore = useUserStore(pinia);
const { logout } = useAuth();
const { profile, fetchProfile, updateNickname, pickAndUploadAvatar } =
  useProfile();

const nicknamePopupVisible = ref(false);
const nicknameDraft = ref("");

function openNicknamePopup() {
  nicknameDraft.value = profile.value?.nickname ?? "";
  nicknamePopupVisible.value = true;
}

async function submitNickname() {
  if (!nicknameDraft.value.trim()) {
    uni.showToast({ title: "请输入昵称", icon: "none" });
    return;
  }

  await updateNickname(nicknameDraft.value.trim());
  nicknamePopupVisible.value = false;
  uni.showToast({ title: "昵称已更新", icon: "none" });
}

function goPasswordPage() {
  uni.navigateTo({ url: "/pages/mine/password?mode=change" });
}

function goChangePhone() {
  uni.navigateTo({ url: "/pages/mine/change-phone" });
}

function goReviewPage() {
  uni.reLaunch({ url: "/pages/review/index" });
}

async function confirmLogout() {
  const result = await new Promise<UniApp.ShowModalRes>((resolve) => {
    uni.showModal({
      title: "退出登录",
      content: "确认退出当前账号吗？",
      success: resolve,
    });
  });

  if (result.confirm) {
    await logout();
  }
}

onShow(() => {
  if (userStore.hasSession) {
    void fetchProfile();
  }
});

onPullDownRefresh(() => {
  void fetchProfile();
});
</script>

<template>
  <view class="min-h-screen bg-page-bg pb-[180rpx]">
    <view
      class="relative overflow-hidden bg-brand-gradient px-[32rpx] pb-[64rpx] pt-safe"
    >
      <view
        class="absolute right-[-50rpx] top-[20rpx] h-[220rpx] w-[220rpx] rounded-full bg-[rgba(255,255,255,0.08)]"
      ></view>
      <view class="relative z-10 pt-[28rpx]">
        <text class="text-[42rpx] font-[700] text-on-brand">个人中心</text>

        <view class="mt-[36rpx] flex items-center gap-[22rpx]">
          <view
            class="center-flex h-[128rpx] w-[128rpx] overflow-hidden rounded-full border-[4rpx] border-[rgba(255,255,255,0.5)] bg-brand-panel text-[48rpx] text-on-brand"
          >
            <image
              v-if="profile?.avatar"
              :src="profile.avatar"
              class="h-full w-full"
              mode="aspectFill"
            ></image>
            <text v-else>人</text>
          </view>
          <view>
            <text class="block text-[38rpx] font-[700] text-on-brand">{{
              profile?.nickname || "未登录"
            }}</text>
            <text class="mt-[10rpx] block text-[26rpx] text-on-brand-muted">{{
              profile?.phone || "请先登录"
            }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="-mt-[40rpx] px-[24rpx]">
      <view class="grid grid-cols-3 gap-[16rpx]">
        <view class="card-surface px-[18rpx] py-[24rpx] text-center">
          <text class="block text-[42rpx] font-[700] text-brand-primary"
            >7</text
          >
          <text class="mt-[10rpx] block text-[22rpx] text-text-secondary"
            >知识点总数</text
          >
        </view>
        <view class="card-surface px-[18rpx] py-[24rpx] text-center">
          <text class="block text-[42rpx] font-[700] text-brand-primary"
            >1</text
          >
          <text class="mt-[10rpx] block text-[22rpx] text-text-secondary"
            >全部完成</text
          >
        </view>
        <view class="card-surface px-[18rpx] py-[24rpx] text-center">
          <text class="block text-[42rpx] font-[700] text-brand-primary"
            >10</text
          >
          <text class="mt-[10rpx] block text-[22rpx] text-text-secondary"
            >复习次数</text
          >
        </view>
      </view>

      <view class="mt-[24rpx] card-surface overflow-hidden">
        <view
          class="flex items-center justify-between px-[28rpx] py-[30rpx]"
          @click="goReviewPage"
        >
          <view class="flex items-center gap-[18rpx]">
            <view
              class="center-flex h-[72rpx] w-[72rpx] rounded-full bg-[rgba(91,69,245,0.1)] text-[28rpx] text-brand-primary"
              >册</view
            >
            <text class="text-[30rpx] font-[700] text-text-primary"
              >我的复习列表</text
            >
          </view>
          <text class="text-[28rpx] text-text-secondary">›</text>
        </view>
        <view class="mx-[28rpx] h-[1rpx] bg-border-subtle"></view>
        <view
          class="flex items-center justify-between px-[28rpx] py-[30rpx]"
          @click="uni.navigateTo({ url: '/pages/topic-entry/index' })"
        >
          <view class="flex items-center gap-[18rpx]">
            <view
              class="center-flex h-[72rpx] w-[72rpx] rounded-full bg-[rgba(142,66,255,0.1)] text-[28rpx] text-brand-secondary"
              >笔</view
            >
            <text class="text-[30rpx] font-[700] text-text-primary"
              >新建知识点</text
            >
          </view>
          <text class="text-[28rpx] text-text-secondary">›</text>
        </view>
      </view>

      <view class="mt-[24rpx] card-surface overflow-hidden">
        <view
          class="flex items-center justify-between px-[28rpx] py-[30rpx]"
          @click="openNicknamePopup"
        >
          <text class="text-[30rpx] font-[700] text-text-primary"
            >编辑昵称</text
          >
          <text class="text-[28rpx] text-text-secondary">›</text>
        </view>
        <view class="mx-[28rpx] h-[1rpx] bg-border-subtle"></view>
        <view
          class="flex items-center justify-between px-[28rpx] py-[30rpx]"
          @click="pickAndUploadAvatar()"
        >
          <text class="text-[30rpx] font-[700] text-text-primary"
            >更换头像</text
          >
          <text class="text-[28rpx] text-text-secondary">›</text>
        </view>
        <view class="mx-[28rpx] h-[1rpx] bg-border-subtle"></view>
        <view
          class="flex items-center justify-between px-[28rpx] py-[30rpx]"
          @click="goPasswordPage"
        >
          <text class="text-[30rpx] font-[700] text-text-primary"
            >修改密码</text
          >
          <text class="text-[28rpx] text-text-secondary">›</text>
        </view>
        <view class="mx-[28rpx] h-[1rpx] bg-border-subtle"></view>
        <view
          class="flex items-center justify-between px-[28rpx] py-[30rpx]"
          @click="goChangePhone"
        >
          <text class="text-[30rpx] font-[700] text-text-primary"
            >换绑手机号</text
          >
          <text class="text-[28rpx] text-text-secondary">›</text>
        </view>
      </view>

      <view
        class="mt-[24rpx] card-surface px-[28rpx] py-[30rpx]"
        @click="confirmLogout"
      >
        <view class="flex items-center justify-between text-danger-text">
          <text class="text-[30rpx] font-[700]">退出登录</text>
          <text class="text-[28rpx]">›</text>
        </view>
      </view>

      <view
        class="mt-[24rpx] rounded-[24rpx] border border-[rgba(91,69,245,0.25)] bg-[rgba(255,255,255,0.56)] px-[24rpx] py-[22rpx] text-[24rpx] leading-[1.8] text-text-secondary"
      >
        <text class="block text-[26rpx] font-[700] text-brand-primary"
          >数据说明</text
        >
        <text class="mt-[10rpx] block"
          >复习计划、知识点录入与个人状态将在后续模块继续补齐；当前导航会明确落到占位页，不会静默失败。</text
        >
      </view>
    </view>

    <view
      v-if="nicknamePopupVisible"
      class="fixed inset-0 z-60 center-flex bg-[rgba(19,16,43,0.36)] px-[36rpx]"
    >
      <view
        class="w-full max-w-[620rpx] rounded-[32rpx] bg-surface-card p-[32rpx] shadow-card"
      >
        <text class="block text-[34rpx] font-[700] text-text-primary"
          >编辑昵称</text
        >
        <input
          v-model="nicknameDraft"
          class="mt-[26rpx] h-[92rpx] rounded-[24rpx] border border-border-subtle px-[24rpx] text-[28rpx] text-text-primary"
          maxlength="20"
          placeholder="请输入新的昵称"
          placeholder-class="text-text-secondary"
        />
        <view class="mt-[28rpx] flex gap-[18rpx]">
          <view
            class="center-flex h-[88rpx] flex-1 rounded-[24rpx] border border-border-subtle text-[28rpx] font-[700] text-text-secondary"
            @click="nicknamePopupVisible = false"
            >取消</view
          >
          <view
            class="center-flex h-[88rpx] flex-1 rounded-[24rpx] bg-brand-gradient text-[28rpx] font-[700] text-on-brand"
            @click="submitNickname"
            >保存</view
          >
        </view>
      </view>
    </view>

    <KnowledgeEntryFab />
    <AppTabBar active="mine" />
  </view>
</template>
