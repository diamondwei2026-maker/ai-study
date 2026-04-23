import { computed, ref } from "vue";

import { pinia } from "@/stores";
import { useUserStore } from "@/stores/user";
import { request, uploadAvatar } from "@/utils/request";

export function useProfile() {
  const userStore = useUserStore(pinia);
  const loading = ref(false);

  const profile = computed(() => userStore.userInfo);

  async function fetchProfile() {
    loading.value = true;
    try {
      const response = await request<{
        id: string;
        phone: string;
        nickname: string;
        avatar: string | null;
        createdAt: string;
      }>({
        url: "/user/profile",
      });

      userStore.patchUserInfo(response.data);
      return response.data;
    } finally {
      loading.value = false;
      uni.stopPullDownRefresh();
    }
  }

  async function updateNickname(nickname: string) {
    const response = await request<
      {
        id: string;
        phone: string;
        nickname: string;
        avatar: string | null;
      },
      { nickname: string }
    >({
      url: "/user/profile",
      method: "PUT",
      data: {
        nickname,
      },
    });

    userStore.patchUserInfo(response.data);
    return response.data;
  }

  async function pickAndUploadAvatar() {
    const chooser = await new Promise<UniApp.ChooseImageSuccessCallbackResult>(
      (resolve, reject) => {
        uni.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
          success: resolve,
          fail: reject,
        });
      },
    );

    const filePath = chooser.tempFilePaths[0];
    if (!filePath) {
      return null;
    }

    const response = await uploadAvatar<{
      id: string;
      phone: string;
      nickname: string;
      avatar: string | null;
    }>(filePath);

    userStore.patchUserInfo(response.data);
    return response.data;
  }

  return {
    profile,
    loading,
    fetchProfile,
    updateNickname,
    pickAndUploadAvatar,
  };
}

export default useProfile;
