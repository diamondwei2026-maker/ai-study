# Quickstart: 知识点录入模块

## 概述

本模块实现用户输入纯文字知识点标题后，一次性完成标准答案准备与初始复习计划初始化。

## 前置条件

- 001 用户登录与账号管理基础设施已按设计落地，至少包含 JWT 鉴权、中间件、统一响应封装和 MongoDB 连接
- 首页、复习列表和个人中心已接入共享知识点录入按钮，或已提供指向 `client/src/pages/topic-entry/index.vue` 的同名占位路由
- 本地可用的 MongoDB 实例，且支持 Mongoose session 事务（推荐单节点副本集）
- Node.js 与 npm 环境可用
- OpenRouter 可用的模型与 API Key
- `client/` 目录下已初始化或将初始化符合宪章的 unibest 工程；`client/UI/` 保留为设计稿资源目录

说明：当前实现会优先使用 Mongoose session 事务；若本地 MongoDB 未启用副本集导致事务不可用，服务会回退到“写入后手动回滚”兜底，仅建议用于本地开发和契约冒烟，不建议替代正式环境的事务能力。

## 初始化步骤

### 1. 后端准备

```bash
cd server
npm install mongoose express-validator jsonwebtoken bcryptjs pino pino-http express-rate-limit
npm run dev
```

推荐环境变量：

```env
MONGODB_URI=mongodb://localhost:27017/ai-study?replicaSet=rs0
JWT_SECRET=replace-with-real-secret
OPENROUTER_MODEL=your-openrouter-model
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MOCK=false
PORT=3000
```

如需在本地无 OpenRouter 凭证时跑通“新生成答案”链路，可临时设置：

```env
OPENROUTER_MOCK=true
```

### 2. 整理后端分层

1. 将现有 `server/src/index.ts` 中的启动、环境加载与 AI 初始化拆分到 `config/`、`utils/`、`services/`
2. 补齐统一响应工具、错误中间件、JWT 鉴权中间件、Rate Limiting 中间件和结构化日志工具
3. 增加 `KnowledgePoint`、`SharedStandardAnswer`、`ReviewNode` 三个 Mongoose Schema
4. 新增 `routes/topics.ts`、`services/topicService.ts`、`services/answerService.ts`、`services/reviewPlanService.ts`
5. 执行 `npm run smoke:topics`，确认 `200/401/409/502` 契约路径可运行

### 3. 前端准备

1. 在 `client/` 根目录初始化 unibest + Vue 3 + TypeScript 工程
2. 接入 Pinia、wot-design-uni、UnoCSS、UnoCSS Icons
3. 配置统一 `request` 封装，禁止在页面中直接调用底层请求 API
4. 新增 `client/src/pages/topic-entry/index.vue` 和 `client/src/composables/useTopicEntry.ts`，并将 `topic-entry` 注册为共享知识点录入按钮的唯一目标页

### 4. 建议实施顺序

1. 先补齐 001 的认证、响应封装、Mongo 连接与日志底座
2. 实现 `POST /api/topics` 的请求校验、共享答案命中/生成和语义去重
3. 接入事务性写入，确保 `KnowledgePoint + ReviewNode x 6` 同步成功或同步失败
4. 实现录入页表单、提交态和成功/失败反馈
5. 将创建结果与首页/后续复习流程衔接，并校验首页、复习列表、个人中心的共享录入入口均指向 `topic-entry`

### 5. 推荐门禁命令

```bash
npm run lint
npm run typecheck
npm run build
npm run smoke:topics
```

## 手工验收场景

### 场景 A：共享知识库已命中

1. 使用已登录用户，从首页、复习列表或个人中心的共享知识点录入按钮进入知识点录入页
2. 输入一个共享知识库已存在的合法纯文字标题
3. 点击“保存并生成计划”，验证成功返回知识点、标准答案和 6 个初始复习节点
4. 验证最近一次待复习时间等于第 1 个节点时间

### 场景 B：共享知识库未命中，需要新生成标准答案

1. 输入一个当前共享知识库不存在的合法标题
2. 点击“保存并生成计划”
3. 验证系统生成标准答案、写回共享知识库，并返回完整创建结果

### 场景 C：重复或语义相近知识点

1. 对同一用户预置一个已有知识点
2. 输入相同标题或语义相近标题后提交
3. 验证系统阻止重复创建，并返回现有知识点提示

### 场景 D：非法输入

1. 分别输入空白标题、超长标题、带链接文本和带 Markdown/富文本痕迹的文本
2. 点击“保存并生成计划”
3. 验证请求被拦截并给出清晰修正提示

### 场景 E：AI 或计划初始化失败

1. 模拟 OpenRouter 调用失败或复习节点写入失败
2. 验证接口返回失败
3. 验证数据库中不存在面向当前用户的半成品知识点或不完整的 6 节点计划

### 场景 F：未认证请求

1. 清空或伪造 `Authorization: Bearer <accessToken>`
2. 调用 `POST /api/topics` 或在录入页提交
3. 验证接口返回 `401`，前端提示登录失效且不落库

## 关键文件目标

```text
server/src/models/KnowledgePoint.ts
server/src/models/SharedStandardAnswer.ts
server/src/models/ReviewNode.ts
server/src/routes/topics.ts
server/src/services/topicService.ts
server/src/services/answerService.ts
server/src/services/reviewPlanService.ts
client/src/pages/topic-entry/index.vue
client/src/composables/useTopicEntry.ts
client/src/stores/knowledgeEntry.ts
```
