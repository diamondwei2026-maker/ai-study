<script setup lang="ts">
const props = defineProps<{
  active: "home" | "review" | "mine";
}>();

const tabs = [
  {
    key: "home",
    label: "首页",
    route: "/pages/home-placeholder/index",
    icon: "⌂",
  },
  {
    key: "review",
    label: "复习",
    route: "/pages/review-placeholder/index",
    icon: "▤",
  },
  { key: "mine", label: "我的", route: "/pages/mine/index", icon: "◉" },
] as const;

function navigate(route: string, key: string) {
  if (props.active === key) {
    return;
  }

  uni.reLaunch({ url: route });
}
</script>

<template>
  <view
    class="fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-surface-card/96 px-[36rpx] pb-safe pt-[14rpx] backdrop-blur-[18rpx]"
  >
    <view class="flex items-center justify-between">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="flex min-w-[140rpx] flex-col items-center gap-[10rpx] py-[10rpx]"
        @click="navigate(tab.route, tab.key)"
      >
        <text
          :class="
            tab.key === active ? 'text-brand-primary' : 'text-text-secondary'
          "
          class="text-[34rpx] leading-none"
          >{{ tab.icon }}</text
        >
        <text
          :class="
            tab.key === active ? 'text-brand-primary' : 'text-text-secondary'
          "
          class="text-[22rpx] font-[600]"
          >{{ tab.label }}</text
        >
      </view>
    </view>
  </view>
</template>
