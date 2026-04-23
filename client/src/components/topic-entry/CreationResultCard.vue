<script setup lang="ts">
import type {
  ExistingKnowledgePointPreview,
  TopicCreationResult,
  TopicFeedbackStatus,
} from "@/types/topic";

const props = defineProps<{
  status: TopicFeedbackStatus;
  result?: TopicCreationResult | null;
  conflict?: ExistingKnowledgePointPreview | null;
  failureMessage?: string;
}>();

function formatDateTime(value: string) {
  const date = new Date(value);
  const month = `${date.getMonth() + 1}`;
  const day = `${date.getDate()}`;
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${month}月${day}日 ${hours}:${minutes}`;
}

function buildAnswerPreview(content: string) {
  if (content.length <= 68) {
    return content;
  }

  return `${content.slice(0, 68)}...`;
}
</script>

<template>
  <view
    v-if="status === 'success' && result"
    class="topic-card px-[28rpx] py-[28rpx]"
  >
    <view class="flex items-center justify-between gap-[18rpx]">
      <text
        class="rounded-full bg-topic-success-bg px-[18rpx] py-[8rpx] text-[22rpx] font-[700] text-topic-success-text"
        >创建成功</text
      >
      <text class="text-[22rpx] text-topic-muted">{{
        result.standardAnswer.source === "reused"
          ? "复用共享答案"
          : "新生成答案"
      }}</text>
    </view>

    <text class="mt-[20rpx] block text-[30rpx] font-[700] text-text-primary">
      {{ result.knowledgePoint.title }}
    </text>
    <text class="mt-[10rpx] block text-[24rpx] leading-[1.7] text-topic-muted">
      最近一次待复习时间：{{ formatDateTime(result.reviewPlan.nextDueAt) }}
    </text>

    <view
      class="mt-[22rpx] rounded-[24rpx] bg-topic-shell px-[22rpx] py-[20rpx]"
    >
      <text class="text-[22rpx] font-[700] text-topic-muted">标准答案摘要</text>
      <text
        class="mt-[12rpx] block text-[24rpx] leading-[1.8] text-text-primary"
      >
        {{ buildAnswerPreview(result.standardAnswer.content) }}
      </text>
    </view>

    <view class="mt-[22rpx] grid grid-cols-2 gap-[16rpx]">
      <view
        v-for="node in result.reviewPlan.nodes"
        :key="node.sequence"
        class="rounded-[22rpx] border border-topic-card-border bg-topic-shell px-[18rpx] py-[18rpx]"
      >
        <text class="text-[22rpx] font-[700] text-brand-primary">{{
          node.label
        }}</text>
        <text class="mt-[10rpx] block text-[22rpx] text-topic-muted">
          {{ formatDateTime(node.dueAt) }}
        </text>
      </view>
    </view>
  </view>

  <view
    v-else-if="status === 'conflict' && conflict"
    class="topic-card border-home-banner-border bg-home-banner-bg px-[28rpx] py-[28rpx]"
  >
    <text
      class="rounded-full bg-home-banner-pill px-[18rpx] py-[8rpx] text-[22rpx] font-[700] text-home-banner-text"
      >已存在相同或相近知识点</text
    >
    <text class="mt-[18rpx] block text-[28rpx] font-[700] text-text-primary">
      {{ conflict.title }}
    </text>
    <text
      class="mt-[10rpx] block text-[24rpx] leading-[1.8] text-home-banner-muted"
    >
      当前知识点已在你的清单中，下次复习时间为
      {{ formatDateTime(conflict.firstReviewAt) }}。
    </text>
  </view>

  <view
    v-else-if="status === 'failure'"
    class="topic-card border-danger-text bg-danger-surface px-[28rpx] py-[28rpx]"
  >
    <text
      class="rounded-full bg-danger-surface px-[18rpx] py-[8rpx] text-[22rpx] font-[700] text-danger-text"
      >创建失败</text
    >
    <text class="mt-[18rpx] block text-[24rpx] leading-[1.8] text-danger-text">
      {{ failureMessage || "标准答案或复习计划暂时未能完成，请稍后重试。" }}
    </text>
    <text class="mt-[10rpx] block text-[22rpx] text-topic-muted">
      当前不会显示为创建成功，也不会生成误导性的半成品计划。
    </text>
  </view>
</template>
