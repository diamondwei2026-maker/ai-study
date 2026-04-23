<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";

import { useAuth } from "@/composables/useAuth";

const { changePassword, resetPassword, sendCode, setPassword } = useAuth();

const mode = ref<"set" | "change" | "reset">("change");
const form = reactive({
  phone: "",
  code: "",
  oldPassword: "",
  newPassword: "",
});
const countdown = ref(0);

let timer: ReturnType<typeof setInterval> | null = null;

function startCountdown(seconds = 60) {
  if (timer) {
    clearInterval(timer);
  }
  countdown.value = seconds;
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0 && timer) {
      clearInterval(timer);
      timer = null;
      countdown.value = 0;
    }
  }, 1000);
}

const title = computed(() => {
  if (mode.value === "set") return "设置密码";
  if (mode.value === "reset") return "重置密码";
  return "修改密码";
});

async function handleSendResetCode() {
  await sendCode("resetPassword", form.phone.trim());
  startCountdown();
}

async function submit() {
  let success = false;

  if (mode.value === "set") {
    success = await setPassword(form.newPassword);
  } else if (mode.value === "change") {
    success = await changePassword(form.oldPassword, form.newPassword);
  } else {
    success = await resetPassword(form.phone, form.code, form.newPassword);
  }

  if (success && mode.value !== "change") {
    uni.navigateBack();
  }
}

onLoad((query) => {
  const nextMode = query.mode;
  if (nextMode === "set" || nextMode === "change" || nextMode === "reset") {
    mode.value = nextMode;
  }
});
</script>

<template>
  <view class="min-h-screen bg-page-bg px-[24rpx] pb-[48rpx] pt-safe">
    <view
      class="bg-brand-gradient px-[28rpx] pb-[38rpx] pt-[28rpx] text-on-brand rounded-b-[32rpx] rounded-t-[32rpx]"
    >
      <text class="text-[40rpx] font-[700]">{{ title }}</text>
      <text class="mt-[12rpx] block text-[24rpx] text-on-brand-muted"
        >设置、修改与重置统一在同一张卡片内完成。</text
      >
    </view>

    <view class="mt-[24rpx] card-surface p-[28rpx]">
      <view class="mb-[22rpx] flex gap-[14rpx]">
        <view
          :class="
            mode === 'set'
              ? 'tab-pill tab-pill-active'
              : 'tab-pill text-text-secondary'
          "
          @click="mode = 'set'"
          >设置密码</view
        >
        <view
          :class="
            mode === 'change'
              ? 'tab-pill tab-pill-active'
              : 'tab-pill text-text-secondary'
          "
          @click="mode = 'change'"
          >修改密码</view
        >
        <view
          :class="
            mode === 'reset'
              ? 'tab-pill tab-pill-active'
              : 'tab-pill text-text-secondary'
          "
          @click="mode = 'reset'"
          >忘记密码</view
        >
      </view>

      <template v-if="mode === 'reset'">
        <input
          v-model="form.phone"
          class="mb-[18rpx] h-[92rpx] rounded-[24rpx] border border-border-subtle px-[24rpx] text-[28rpx] text-text-primary"
          maxlength="11"
          placeholder="手机号"
          placeholder-class="text-text-secondary"
          type="number"
        />
        <view class="mb-[18rpx] flex gap-[14rpx]">
          <input
            v-model="form.code"
            class="h-[92rpx] flex-1 rounded-[24rpx] border border-border-subtle px-[24rpx] text-[28rpx] text-text-primary"
            maxlength="6"
            placeholder="验证码"
            placeholder-class="text-text-secondary"
            type="number"
          />
          <view
            class="center-flex min-w-[200rpx] rounded-[24rpx] border border-brand-primary px-[16rpx] text-[24rpx] font-[700]"
            :class="
              countdown > 0
                ? 'border-border-subtle text-text-secondary'
                : 'text-brand-primary'
            "
            @click="handleSendResetCode"
          >
            {{ countdown > 0 ? `${countdown}s 后重发` : "获取验证码" }}
          </view>
        </view>
      </template>

      <input
        v-if="mode === 'change'"
        v-model="form.oldPassword"
        class="mb-[18rpx] h-[92rpx] rounded-[24rpx] border border-border-subtle px-[24rpx] text-[28rpx] text-text-primary"
        password
        placeholder="当前密码"
        placeholder-class="text-text-secondary"
      />
      <input
        v-model="form.newPassword"
        class="h-[92rpx] rounded-[24rpx] border border-border-subtle px-[24rpx] text-[28rpx] text-text-primary"
        password
        placeholder="新的密码，至少 8 位且包含字母数字"
        placeholder-class="text-text-secondary"
      />

      <view
        class="mt-[28rpx] center-flex h-[92rpx] rounded-[24rpx] bg-brand-gradient text-[30rpx] font-[700] text-on-brand"
        @click="submit"
      >
        确认提交
      </view>
    </view>
  </view>
</template>
