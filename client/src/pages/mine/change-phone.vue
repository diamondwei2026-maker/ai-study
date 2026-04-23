<script setup lang="ts">
import { computed, reactive, ref } from "vue";

import { pinia } from "@/stores";
import { useUserStore } from "@/stores/user";
import { request } from "@/utils/request";

const userStore = useUserStore(pinia);
const form = reactive({
  oldCode: "",
  newPhone: "",
  newCode: "",
});
const oldCountdown = ref(0);
const newCountdown = ref(0);

let oldTimer: ReturnType<typeof setInterval> | null = null;
let newTimer: ReturnType<typeof setInterval> | null = null;

function maskPhone(phone: string) {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
}

function startCountdown(target: "old" | "new", seconds = 60) {
  const timerRef = target === "old" ? oldTimer : newTimer;
  if (timerRef) {
    clearInterval(timerRef);
  }

  if (target === "old") {
    oldCountdown.value = seconds;
    oldTimer = setInterval(() => {
      oldCountdown.value -= 1;
      if (oldCountdown.value <= 0 && oldTimer) {
        clearInterval(oldTimer);
        oldTimer = null;
        oldCountdown.value = 0;
      }
    }, 1000);
    return;
  }

  newCountdown.value = seconds;
  newTimer = setInterval(() => {
    newCountdown.value -= 1;
    if (newCountdown.value <= 0 && newTimer) {
      clearInterval(newTimer);
      newTimer = null;
      newCountdown.value = 0;
    }
  }, 1000);
}

const currentPhone = computed(() => userStore.userInfo?.rawPhone ?? "");

async function sendOldCode() {
  if (!currentPhone.value) {
    uni.showToast({ title: "缺少当前手机号", icon: "none" });
    return;
  }

  await request<null, { phone: string; type: "changePhone" }>({
    url: "/auth/send-code",
    method: "POST",
    auth: false,
    data: {
      phone: currentPhone.value,
      type: "changePhone",
    },
  });

  startCountdown("old");
  uni.showToast({ title: "原手机号验证码已发送", icon: "none" });
}

async function sendNewCode() {
  if (!/^1\d{10}$/.test(form.newPhone.trim())) {
    uni.showToast({ title: "请输入有效的新手机号", icon: "none" });
    return;
  }

  await request<null, { phone: string; type: "changePhone" }>({
    url: "/auth/send-code",
    method: "POST",
    auth: false,
    data: {
      phone: form.newPhone.trim(),
      type: "changePhone",
    },
  });

  startCountdown("new");
  uni.showToast({ title: "新手机号验证码已发送", icon: "none" });
}

async function submit() {
  await request<
    {
      id: string;
      phone: string;
      nickname: string;
      avatar: string | null;
    },
    { oldCode: string; newPhone: string; newCode: string }
  >({
    url: "/user/change-phone",
    method: "POST",
    data: {
      oldCode: form.oldCode.trim(),
      newPhone: form.newPhone.trim(),
      newCode: form.newCode.trim(),
    },
  });

  userStore.patchUserInfo({
    phone: maskPhone(form.newPhone.trim()),
    rawPhone: form.newPhone.trim(),
  });
  uni.showToast({ title: "手机号已更新", icon: "none" });
  uni.navigateBack();
}
</script>

<template>
  <view class="min-h-screen bg-page-bg px-[24rpx] pb-[48rpx] pt-safe">
    <view
      class="rounded-[32rpx] bg-brand-gradient px-[28rpx] pb-[38rpx] pt-[28rpx] text-on-brand"
    >
      <text class="text-[40rpx] font-[700]">换绑手机号</text>
      <text class="mt-[12rpx] block text-[24rpx] text-on-brand-muted"
        >先验证原手机号，再绑定新的手机号。</text
      >
    </view>

    <view class="mt-[24rpx] card-surface p-[28rpx]">
      <view class="mb-[26rpx] flex items-center gap-[12rpx]">
        <view
          class="center-flex h-[40rpx] w-[40rpx] rounded-full bg-brand-primary text-[22rpx] text-on-brand"
          >1</view
        >
        <text class="text-[28rpx] font-[700] text-text-primary"
          >验证原手机号 {{ currentPhone ? maskPhone(currentPhone) : "" }}</text
        >
      </view>
      <view class="flex gap-[14rpx]">
        <input
          v-model="form.oldCode"
          class="h-[92rpx] flex-1 rounded-[24rpx] border border-border-subtle px-[24rpx] text-[28rpx] text-text-primary"
          maxlength="6"
          placeholder="原手机号验证码"
          placeholder-class="text-text-secondary"
          type="number"
        />
        <view
          class="center-flex min-w-[200rpx] rounded-[24rpx] border border-brand-primary px-[16rpx] text-[24rpx] font-[700]"
          :class="
            oldCountdown > 0
              ? 'border-border-subtle text-text-secondary'
              : 'text-brand-primary'
          "
          @click="sendOldCode"
        >
          {{ oldCountdown > 0 ? `${oldCountdown}s 后重发` : "发送验证码" }}
        </view>
      </view>

      <view class="my-[28rpx] h-[1rpx] bg-border-subtle"></view>

      <view class="mb-[26rpx] flex items-center gap-[12rpx]">
        <view
          class="center-flex h-[40rpx] w-[40rpx] rounded-full bg-brand-primary text-[22rpx] text-on-brand"
          >2</view
        >
        <text class="text-[28rpx] font-[700] text-text-primary"
          >绑定新手机号</text
        >
      </view>
      <input
        v-model="form.newPhone"
        class="mb-[18rpx] h-[92rpx] rounded-[24rpx] border border-border-subtle px-[24rpx] text-[28rpx] text-text-primary"
        maxlength="11"
        placeholder="新的手机号"
        placeholder-class="text-text-secondary"
        type="number"
      />
      <view class="flex gap-[14rpx]">
        <input
          v-model="form.newCode"
          class="h-[92rpx] flex-1 rounded-[24rpx] border border-border-subtle px-[24rpx] text-[28rpx] text-text-primary"
          maxlength="6"
          placeholder="新手机号验证码"
          placeholder-class="text-text-secondary"
          type="number"
        />
        <view
          class="center-flex min-w-[200rpx] rounded-[24rpx] border border-brand-primary px-[16rpx] text-[24rpx] font-[700]"
          :class="
            newCountdown > 0
              ? 'border-border-subtle text-text-secondary'
              : 'text-brand-primary'
          "
          @click="sendNewCode"
        >
          {{ newCountdown > 0 ? `${newCountdown}s 后重发` : "发送验证码" }}
        </view>
      </view>

      <view
        class="mt-[28rpx] center-flex h-[92rpx] rounded-[24rpx] bg-brand-gradient text-[30rpx] font-[700] text-on-brand"
        @click="submit"
      >
        完成换绑
      </view>
    </view>
  </view>
</template>
