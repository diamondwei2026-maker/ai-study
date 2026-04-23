<script setup lang="ts">
import { useAuth } from "@/composables/useAuth";

const {
  mode,
  loginMethod,
  form,
  countdown,
  sendingCode,
  submitting,
  isCodeLogin,
  setMode,
  setLoginMethod,
  sendCode,
  submit,
} = useAuth();

function goResetPassword() {
  uni.navigateTo({ url: "/pages/mine/password?mode=reset" });
}
</script>

<template>
  <view class="min-h-screen overflow-hidden bg-page-bg">
    <view
      class="relative overflow-hidden rounded-b-[44rpx] bg-brand-gradient px-[34rpx] pb-[40rpx] pt-safe"
    >
      <view
        class="absolute right-[-70rpx] top-[-40rpx] h-[240rpx] w-[240rpx] rounded-full bg-[rgba(255,255,255,0.08)]"
      ></view>
      <view
        class="absolute left-[-80rpx] top-[140rpx] h-[180rpx] w-[180rpx] rounded-full bg-[rgba(255,255,255,0.06)]"
      ></view>

      <view class="relative z-10 pt-[36rpx]">
        <view class="flex items-center gap-[24rpx]">
          <view
            class="center-flex h-[104rpx] w-[104rpx] rounded-[28rpx] border border-[rgba(255,255,255,0.26)] bg-brand-panel text-[42rpx] text-on-brand"
          >
            脑
          </view>
          <view>
            <text class="block text-[40rpx] font-[700] text-on-brand"
              >记忆助手</text
            >
            <text class="mt-[10rpx] block text-[24rpx] text-on-brand-muted"
              >艾宾浩斯 · 复习输出 · AI 检测</text
            >
          </view>
        </view>

        <view class="mt-[52rpx]">
          <text class="block text-[54rpx] font-[700] text-on-brand">
            {{ mode === "login" ? "欢迎回来" : "立即注册" }}
          </text>
          <text class="mt-[14rpx] block text-[26rpx] text-on-brand-muted">
            {{
              mode === "login"
                ? "登录后继续你的复习计划"
                : "完成注册后默认进入个人中心"
            }}
          </text>
        </view>
      </view>
    </view>

    <view
      class="-mt-[6rpx] rounded-t-[30rpx] bg-surface-card px-[32rpx] pb-[52rpx] pt-[18rpx] shadow-card"
    >
      <view class="flex items-center border-b border-border-subtle">
        <view class="flex-1 py-[22rpx] text-center" @click="setMode('login')">
          <text
            :class="
              mode === 'login' ? 'text-brand-primary' : 'text-text-secondary'
            "
            class="text-[30rpx] font-[700]"
            >登录</text
          >
          <view
            v-if="mode === 'login'"
            class="mx-auto mt-[18rpx] h-[6rpx] w-[86rpx] rounded-full bg-brand-primary"
          ></view>
          <view v-else class="mx-auto mt-[18rpx] h-[6rpx] w-[86rpx]"></view>
        </view>
        <view
          class="flex-1 py-[22rpx] text-center"
          @click="setMode('register')"
        >
          <text
            :class="
              mode === 'register' ? 'text-brand-primary' : 'text-text-secondary'
            "
            class="text-[30rpx] font-[700]"
            >注册</text
          >
          <view
            v-if="mode === 'register'"
            class="mx-auto mt-[18rpx] h-[6rpx] w-[86rpx] rounded-full bg-brand-primary"
          ></view>
          <view v-else class="mx-auto mt-[18rpx] h-[6rpx] w-[86rpx]"></view>
        </view>
      </view>

      <view class="mt-[34rpx] card-surface p-[36rpx]">
        <view v-if="mode === 'login'" class="mb-[28rpx] flex gap-[16rpx]">
          <view
            :class="
              isCodeLogin
                ? 'tab-pill tab-pill-active'
                : 'tab-pill text-text-secondary'
            "
            @click="setLoginMethod('code')"
            >验证码登录</view
          >
          <view
            :class="
              !isCodeLogin
                ? 'tab-pill tab-pill-active'
                : 'tab-pill text-text-secondary'
            "
            @click="setLoginMethod('password')"
            >密码登录</view
          >
        </view>

        <view class="text-[24rpx] font-[600] text-text-secondary">手机号</view>
        <view
          class="mt-[14rpx] flex h-[96rpx] items-center rounded-[28rpx] border border-border-subtle px-[24rpx]"
        >
          <text class="mr-[16rpx] text-[30rpx] text-text-secondary">☎</text>
          <input
            v-model="form.phone"
            class="h-full flex-1 text-[28rpx] text-text-primary"
            maxlength="11"
            placeholder="请输入 11 位手机号"
            placeholder-class="text-text-secondary"
            type="number"
          />
        </view>

        <template v-if="mode === 'register' || isCodeLogin">
          <view class="mt-[28rpx] text-[24rpx] font-[600] text-text-secondary"
            >验证码</view
          >
          <view class="mt-[14rpx] flex items-center gap-[16rpx]">
            <view
              class="flex h-[96rpx] flex-1 items-center rounded-[28rpx] border border-border-subtle px-[24rpx]"
            >
              <text class="mr-[16rpx] text-[30rpx] text-text-secondary">#</text>
              <input
                v-model="form.code"
                class="h-full flex-1 text-[28rpx] text-text-primary"
                maxlength="6"
                placeholder="请输入验证码"
                placeholder-class="text-text-secondary"
                type="number"
              />
            </view>
            <view
              class="center-flex h-[72rpx] min-w-[212rpx] rounded-[36rpx] border border-brand-primary px-[20rpx] text-[24rpx] font-[700]"
              :class="
                countdown > 0 || sendingCode
                  ? 'border-border-subtle text-text-secondary'
                  : 'text-brand-primary'
              "
              @click="sendCode()"
            >
              {{ countdown > 0 ? `${countdown}s 后重新获取` : "获取验证码" }}
            </view>
          </view>
        </template>

        <template v-else>
          <view class="mt-[28rpx] text-[24rpx] font-[600] text-text-secondary"
            >密码</view
          >
          <view
            class="mt-[14rpx] flex h-[96rpx] items-center rounded-[28rpx] border border-border-subtle px-[24rpx]"
          >
            <text class="mr-[16rpx] text-[30rpx] text-text-secondary">⌘</text>
            <input
              v-model="form.password"
              class="h-full flex-1 text-[28rpx] text-text-primary"
              password
              placeholder="请输入密码"
              placeholder-class="text-text-secondary"
            />
            <text class="text-[28rpx] text-text-secondary">◌</text>
          </view>
          <view class="mt-[16rpx] flex justify-end">
            <text
              class="text-[24rpx] text-brand-primary"
              @click="goResetPassword"
              >忘记密码</text
            >
          </view>
        </template>

        <view
          class="mt-[40rpx] center-flex h-[96rpx] rounded-[48rpx] bg-brand-gradient text-[34rpx] font-[700] text-on-brand shadow-card"
          @click="submit"
        >
          {{ submitting ? "处理中..." : mode === "login" ? "登录" : "注册" }}
        </view>
      </view>

      <view
        class="mt-[30rpx] rounded-[24rpx] bg-[rgba(255,255,255,0.75)] px-[28rpx] py-[22rpx] text-center text-[24rpx] leading-[1.7] text-text-secondary"
      >
        <text
          >💡
          原型演示：可直接注册新账号后登录，或使用任意手机号+密码注册体验</text
        >
      </view>
    </view>
  </view>
</template>
