import { pinia } from "@/stores";
import { useUserStore } from "@/stores/user";

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export interface RequestConfig<TData = Record<string, unknown>> {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: TData;
  headers?: Record<string, string>;
  auth?: boolean;
  retry?: boolean;
  suppressErrorToast?: boolean;
}

const DEFAULT_BASE_URL = "http://localhost:3000/api";
const baseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_BASE_URL;
let refreshPromise: Promise<string> | null = null;

function resolveUrl(path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function currentRoute() {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return currentPage?.route ? `/${currentPage.route}` : "";
}

function redirectToLogin() {
  if (currentRoute() !== "/pages/login/index") {
    uni.reLaunch({ url: "/pages/login/index" });
  }
}

function showNetworkError(message = "网络异常，请稍后重试") {
  uni.showToast({
    title: message,
    icon: "none",
    duration: 2200,
  });
}

function requestRaw<T>(config: RequestConfig, accessToken?: string) {
  return new Promise<ApiEnvelope<T>>((resolve, reject) => {
    uni.request({
      url: resolveUrl(config.url),
      method: config.method ?? "GET",
      data: config.data,
      header: {
        "Content-Type": "application/json",
        ...config.headers,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      success: (response) => {
        const envelope = response.data as ApiEnvelope<T>;
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(envelope);
          return;
        }

        reject({
          statusCode: response.statusCode,
          envelope,
        });
      },
      fail: (error) => {
        reject(error);
      },
    });
  });
}

async function performRefresh() {
  const userStore = useUserStore(pinia);
  if (!userStore.refreshToken) {
    throw new Error("missing refresh token");
  }

  const envelope = await requestRaw<{ accessToken: string }>(
    {
      url: "/auth/refresh",
      method: "POST",
      data: {
        refreshToken: userStore.refreshToken,
      },
      auth: false,
    },
    undefined,
  );

  userStore.updateAccessToken(envelope.data.accessToken);
  return envelope.data.accessToken;
}

async function ensureAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function request<
  T,
  TData extends Record<string, unknown> = Record<string, unknown>,
>(config: RequestConfig<TData>) {
  const userStore = useUserStore(pinia);
  userStore.loadFromStorage();

  try {
    return await requestRaw<T>(
      config,
      config.auth === false ? undefined : userStore.accessToken || undefined,
    );
  } catch (error) {
    const httpError = error as {
      statusCode?: number;
      envelope?: ApiEnvelope<T>;
    };

    if (
      httpError.statusCode === 401 &&
      config.auth !== false &&
      userStore.refreshToken &&
      !config.retry
    ) {
      try {
        const accessToken = await ensureAccessToken();
        return await requestRaw<T>(config, accessToken);
      } catch {
        userStore.clearAuth();
        redirectToLogin();
        throw error;
      }
    }

    if (httpError.statusCode === 401) {
      userStore.clearAuth();
      redirectToLogin();
    }

    if (!config.suppressErrorToast && httpError.envelope?.message) {
      showNetworkError(httpError.envelope.message);
    } else if (!config.suppressErrorToast) {
      showNetworkError();
    }

    throw error;
  }
}

function uploadFileRaw<T>(url: string, filePath: string, accessToken?: string) {
  return new Promise<ApiEnvelope<T>>((resolve, reject) => {
    uni.uploadFile({
      url: resolveUrl(url),
      filePath,
      name: "avatar",
      header: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      success: (response) => {
        const envelope = JSON.parse(response.data) as ApiEnvelope<T>;
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(envelope);
          return;
        }

        reject({
          statusCode: response.statusCode,
          envelope,
        });
      },
      fail: (error) => {
        reject(error);
      },
    });
  });
}

export async function uploadAvatar<T>(filePath: string) {
  const userStore = useUserStore(pinia);
  userStore.loadFromStorage();

  try {
    return await uploadFileRaw<T>(
      "/user/avatar",
      filePath,
      userStore.accessToken || undefined,
    );
  } catch (error) {
    const httpError = error as {
      statusCode?: number;
      envelope?: ApiEnvelope<T>;
    };

    if (httpError.statusCode === 401 && userStore.refreshToken) {
      try {
        const accessToken = await ensureAccessToken();
        return await uploadFileRaw<T>("/user/avatar", filePath, accessToken);
      } catch {
        userStore.clearAuth();
        redirectToLogin();
      }
    }

    showNetworkError(httpError.envelope?.message);
    throw error;
  }
}
