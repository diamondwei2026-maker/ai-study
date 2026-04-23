import { computed, onUnmounted, reactive, ref, watch } from "vue";

import { pinia } from "@/stores";
import { useUserStore, type AuthPayload } from "@/stores/user";
import { request } from "@/utils/request";

type AuthMode = "login" | "register";
type LoginMethod = "password" | "code";
type VerificationCodeType =
  | "register"
  | "login"
  | "resetPassword"
  | "changePhone";

const DRAFT_STORAGE_KEY = "ai-study:auth-draft";

function isValidPhone(phone: string) {
  return /^1\d{10}$/.test(phone);
}

function isValidCode(code: string) {
  return /^\d{6}$/.test(code);
}

function isValidPassword(password: string) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

function showMessage(message: string) {
  uni.showToast({
    title: message,
    icon: "none",
    duration: 2200,
  });
}

export function useAuth() {
  const userStore = useUserStore(pinia);
  const mode = ref<AuthMode>("login");
  const loginMethod = ref<LoginMethod>("password");
  const countdown = ref(0);
  const sendingCode = ref(false);
  const submitting = ref(false);
  const form = reactive({
    phone: "",
    code: "",
    password: "",
    agree: true,
  });

  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let lastSubmitAt = 0;

  function persistDraft() {
    uni.setStorageSync(DRAFT_STORAGE_KEY, {
      mode: mode.value,
      loginMethod: loginMethod.value,
      form: {
        phone: form.phone,
        code: form.code,
        password: form.password,
      },
    });
  }

  function loadDraft() {
    const snapshot = uni.getStorageSync(DRAFT_STORAGE_KEY) as {
      mode?: AuthMode;
      loginMethod?: LoginMethod;
      form?: Partial<typeof form>;
    } | null;

    if (!snapshot) {
      return;
    }

    mode.value = snapshot.mode ?? "login";
    loginMethod.value = snapshot.loginMethod ?? "password";
    form.phone = snapshot.form?.phone ?? "";
    form.code = snapshot.form?.code ?? "";
    form.password = snapshot.form?.password ?? "";
  }

  function clearDraft() {
    uni.removeStorageSync(DRAFT_STORAGE_KEY);
  }

  function resetForm() {
    form.code = "";
    form.password = "";
  }

  function setMode(nextMode: AuthMode) {
    if (mode.value === nextMode) {
      return;
    }

    mode.value = nextMode;
    resetForm();
  }

  function setLoginMethod(nextMethod: LoginMethod) {
    if (loginMethod.value === nextMethod) {
      return;
    }

    loginMethod.value = nextMethod;
    resetForm();
  }

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function startCountdown(seconds = 60) {
    stopCountdown();
    countdown.value = seconds;
    countdownTimer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) {
        stopCountdown();
        countdown.value = 0;
      }
    }, 1000);
  }

  async function sendCode(type?: VerificationCodeType, targetPhone?: string) {
    const phone = (targetPhone ?? form.phone).trim();
    if (!isValidPhone(phone)) {
      showMessage("请输入有效的 11 位手机号");
      return;
    }

    if (countdown.value > 0 || sendingCode.value) {
      return;
    }

    sendingCode.value = true;
    try {
      await request<null, { phone: string; type: VerificationCodeType }>({
        url: "/auth/send-code",
        method: "POST",
        auth: false,
        data: {
          phone,
          type: type ?? (mode.value === "register" ? "register" : "login"),
        },
      });
      startCountdown();
      showMessage("验证码已发送");
    } finally {
      sendingCode.value = false;
    }
  }

  function applyAuth(payload: AuthPayload, rawPhone: string) {
    userStore.setAuth(payload, rawPhone);
    clearDraft();
    uni.reLaunch({ url: "/pages/mine/index" });
  }

  async function loginAction() {
    const phone = form.phone.trim();
    if (!isValidPhone(phone)) {
      showMessage("请输入有效的 11 位手机号");
      return;
    }

    if (loginMethod.value === "code") {
      if (!isValidCode(form.code.trim())) {
        showMessage("请输入 6 位验证码");
        return;
      }
    } else if (!isValidPassword(form.password.trim())) {
      showMessage("密码至少 8 位，且需同时包含字母和数字");
      return;
    }

    const response = await request<
      AuthPayload,
      { phone: string; code?: string; password?: string }
    >({
      url: "/auth/login",
      method: "POST",
      auth: false,
      data: {
        phone,
        ...(loginMethod.value === "code"
          ? { code: form.code.trim() }
          : { password: form.password.trim() }),
      },
    });

    applyAuth(response.data, phone);
  }

  async function registerAction() {
    const phone = form.phone.trim();
    if (!isValidPhone(phone)) {
      showMessage("请输入有效的 11 位手机号");
      return;
    }

    if (!isValidCode(form.code.trim())) {
      showMessage("请输入 6 位验证码");
      return;
    }

    const response = await request<
      AuthPayload,
      { phone: string; code: string }
    >({
      url: "/auth/register",
      method: "POST",
      auth: false,
      data: {
        phone,
        code: form.code.trim(),
      },
    });

    applyAuth(response.data, phone);
  }

  async function submit() {
    const now = Date.now();
    if (submitting.value || now - lastSubmitAt < 300) {
      return;
    }

    lastSubmitAt = now;
    submitting.value = true;
    try {
      if (mode.value === "login") {
        await loginAction();
      } else {
        await registerAction();
      }
    } finally {
      submitting.value = false;
    }
  }

  async function setPassword(password: string) {
    if (!isValidPassword(password.trim())) {
      showMessage("密码至少 8 位，且需同时包含字母和数字");
      return false;
    }

    await request<null, { password: string }>({
      url: "/auth/password/set",
      method: "POST",
      data: {
        password: password.trim(),
      },
    });

    showMessage("密码设置成功");
    return true;
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    if (
      !isValidPassword(oldPassword.trim()) ||
      !isValidPassword(newPassword.trim())
    ) {
      showMessage("密码至少 8 位，且需同时包含字母和数字");
      return false;
    }

    await request<null, { oldPassword: string; newPassword: string }>({
      url: "/auth/password/change",
      method: "POST",
      data: {
        oldPassword: oldPassword.trim(),
        newPassword: newPassword.trim(),
      },
    });

    showMessage("密码修改成功，请重新登录");
    await logout();
    return true;
  }

  async function resetPassword(
    phone: string,
    code: string,
    newPassword: string,
  ) {
    if (!isValidPhone(phone.trim())) {
      showMessage("请输入有效的 11 位手机号");
      return false;
    }

    if (!isValidCode(code.trim())) {
      showMessage("请输入 6 位验证码");
      return false;
    }

    if (!isValidPassword(newPassword.trim())) {
      showMessage("密码至少 8 位，且需同时包含字母和数字");
      return false;
    }

    await request<null, { phone: string; code: string; newPassword: string }>({
      url: "/auth/password/reset",
      method: "POST",
      auth: false,
      data: {
        phone: phone.trim(),
        code: code.trim(),
        newPassword: newPassword.trim(),
      },
    });

    showMessage("密码重置成功，请使用新密码登录");
    uni.reLaunch({ url: "/pages/login/index" });
    return true;
  }

  async function logout() {
    const refreshToken = userStore.refreshToken;
    try {
      if (refreshToken) {
        await request<null, { refreshToken: string }>({
          url: "/auth/logout",
          method: "POST",
          data: {
            refreshToken,
          },
        });
      }
    } finally {
      userStore.clearAuth();
      uni.reLaunch({ url: "/pages/login/index" });
    }
  }

  watch(
    () => ({
      mode: mode.value,
      loginMethod: loginMethod.value,
      phone: form.phone,
      code: form.code,
      password: form.password,
    }),
    () => {
      persistDraft();
    },
    { deep: true },
  );

  loadDraft();
  onUnmounted(() => {
    stopCountdown();
  });

  return {
    mode,
    loginMethod,
    form,
    countdown,
    sendingCode,
    submitting,
    isCodeLogin: computed(() => loginMethod.value === "code"),
    setMode,
    setLoginMethod,
    sendCode,
    submit,
    setPassword,
    changePassword,
    resetPassword,
    logout,
  };
}

export default useAuth;
