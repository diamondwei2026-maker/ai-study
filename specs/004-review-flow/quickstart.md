# Quickstart: 复习全流程模块

## 概述

本模块实现知识点复习的完整闭环，包括复习列表、到期提醒、费曼输出、AI 判定、计划调整和异常风险提示。

## 前置条件

- 001 用户登录与账号管理基础设施已按设计落地，至少包含 JWT 鉴权、中间件、统一响应封装和 MongoDB 连接
- 003 知识点录入模块已按设计落地，至少包含 `KnowledgePoint`、`SharedStandardAnswer` 和初始 `ReviewNode` 数据
- 003 知识点录入页统一注册为 `client/src/pages/topic-entry/index.vue`，供共享知识点录入按钮跳转
- 本地可用的 MongoDB 实例，且支持 Mongoose session 事务（推荐单节点副本集）
- Node.js 与 npm 环境可用
- OpenRouter 可用的模型与 API Key
- `client/` 目录下已初始化或将初始化符合宪章的 unibest 工程
- 设计稿资源可用：`client/UI/review-list.png`、`client/UI/feynman-output.png`

## 初始化步骤

### 1. 后端准备

```bash
cd server
npm install mongoose express-validator jsonwebtoken bcryptjs pino pino-http
npm run dev
```

推荐环境变量：

```env
MONGODB_URI=mongodb://localhost:27017/ai-study?replicaSet=rs0
JWT_SECRET=replace-with-real-secret
OPENROUTER_MODEL=your-openrouter-model
OPENROUTER_API_KEY=your-openrouter-api-key
PORT=3000
```

### 2. 整理后端分层

1. 将现有 `server/src/index.ts` 中的启动、环境加载与 AI 初始化拆分到 `config/`、`utils/`、`services/`
2. 补齐统一响应工具、错误中间件、JWT 鉴权中间件和结构化日志工具
3. 扩展 `ReviewNode` 状态字段，并新增 `ReviewAttempt` 模型
4. 新增 `routes/review.ts`、`services/reviewListService.ts`、`services/reviewExecutionService.ts`、`services/reviewPlanningService.ts`、`services/reminderPolicyService.ts`

### 3. 前端准备

1. 在 `client/` 根目录初始化 unibest + Vue 3 + TypeScript 工程
2. 接入 Pinia、wot-design-uni、UnoCSS、UnoCSS Icons
3. 配置统一 `request` 封装与本地通知调度工具
4. 新增 `client/src/pages/review/index.vue` 和 `client/src/pages/review-session/index.vue`，并在复习列表页接入共享底部导航与知识点录入悬浮按钮

### 4. 建议实施顺序

1. 先补齐 001 的认证、响应封装、Mongo 连接与日志底座
2. 扩展 003 的 `ReviewNode` 能力，完成复习列表接口和过期分级聚合
3. 接入本地提醒策略与本地提醒元数据重建/取消逻辑
4. 实现费曼页面、AI 判定接口和计划调整事务
5. 完成风险提示、异常处理和从通知跳转到复习页的联调

## 手工验收场景

### 场景 A：按时复习并完成一次闭环

1. 使用已登录用户进入复习列表，确认存在一个到期待复习任务
2. 点击任务进入费曼页面，输入合法纯文字内容并提交
3. 验证系统返回判定结果与原因，更新任务状态，并生成新的下次复习时间
4. 验证用户返回列表后可看到刷新后的任务状态与排序
5. 验证复习列表页底部导航激活项为复习，点击右下角知识点录入按钮进入 `topic-entry`

### 场景 B：短期过期任务与追加提醒

1. 构造一个已过期 1 小时以上、24 小时以内的任务
2. 验证该任务在列表中显示为短期过期，并收到过期后 1 小时提醒
3. 完成复习后，验证未触发的后续提醒被取消，且计划按 A 方案生成补强或回退节点

### 场景 C：长期过期重置计划

1. 构造一个已过期超过 7 天的任务
2. 进入费曼页面并提交合法内容
3. 验证系统无论 AI 判定结果为何，都会将该知识点重置到最早计划节点

### 场景 D：风险提示与置顶提醒

1. 构造同一知识点累计过期 3 次的场景
2. 验证该知识点在复习列表中被置顶
3. 再构造总过期任务超过 10 个的场景，验证进入列表时出现风险提示弹窗

### 场景 E：AI 或状态更新失败

1. 模拟 OpenRouter 调用失败或事务写入失败
2. 在费曼页面提交一段有效文本
3. 验证页面提示失败、原任务仍可继续处理，且本地草稿可用于重试

## 关键文件目标

```text
server/src/models/ReviewNode.ts
server/src/models/ReviewAttempt.ts
server/src/routes/review.ts
server/src/services/reviewListService.ts
server/src/services/reviewExecutionService.ts
server/src/services/reviewPlanningService.ts
server/src/services/reminderPolicyService.ts
server/src/services/aiReviewService.ts
client/src/pages/review/index.vue
client/src/pages/review-session/index.vue
client/src/components/shared/navigation/AppTabBar.vue
client/src/components/shared/navigation/KnowledgeEntryFab.vue
client/src/composables/useReviewList.ts
client/src/composables/useReviewSession.ts
client/src/composables/useReviewNotifications.ts
```
