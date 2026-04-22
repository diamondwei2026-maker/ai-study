# Quickstart: 首页模块

## 概述

本模块实现 APP 首页作为核心入口的三项能力：复习状态总览、关键操作入口以及跨模块任务引导。本期首页仅负责衔接知识点录入 `topic-entry` 与复习流程，不包含学习记录入口。

## 前置条件

- 001 用户登录与账号管理基础设施已按设计落地，至少包含认证中间件、统一响应封装与 MongoDB 连接
- 003 知识点录入页已统一注册为 `client/src/pages/topic-entry/index.vue`，或已提供同名占位页供首页导航接入
- 本地可用的 MongoDB 实例
- Node.js 与 npm 环境可用
- `client/UI/home.png` 作为首页视觉稿参考

## 初始化步骤

### 1. 后端准备

```bash
cd server
npm install mongoose express-validator jsonwebtoken bcryptjs
npm run dev
```

推荐环境变量：

```env
MONGODB_URI=mongodb://localhost:27017/ai-study
JWT_SECRET=replace-with-real-secret
PORT=3000
```

### 2. 前端准备

- 在 `client/` 目录按 unibest 官方方式初始化 Vue 3 + TypeScript 工程
- 安装并启用 Pinia、wot-design-uni、UnoCSS、UnoCSS Icons
- 保留 `client/UI/` 设计稿目录，不将源码写入其中
- 配置统一请求封装，禁止直接在页面内调用底层请求 API

### 3. 实施顺序

1. 先补齐 001 认证基础设施的可复用实现
2. 新增首页聚合接口 `GET /api/home/dashboard`
3. 新增首页行为记录接口 `POST /api/home/action-events`
4. 在前端实现首页页面、首页 store 和 `useHome` composable
5. 复用共享底部导航与知识点录入悬浮按钮，并将首页关键入口统一接入 `topic-entry` 与复习流程

## 契约与性能验证

### 契约核对

1. 启动后端后使用已登录 Token 请求 `GET /api/home/dashboard`
2. 对照 `specs/002-home-page-module/contracts/api.md` 核验 `generatedAt`、`reviewStatus`、`primaryActions`、`guidance` 字段是否完整
3. 在无待复习任务场景下再次请求，确认 `startReview.enabled=false` 且返回 `disabledReason`
4. 发送 `POST /api/home/action-events`，分别验证成功写入与参数错误时的响应结构

### 性能采样

1. 对 `GET /api/home/dashboard` 连续采样 10 次，记录每次耗时并计算 p95，目标小于 500ms
2. 进入首页后开始计时，记录到“开始复习”或“新建知识点”按钮可点击的耗时，目标小于 2 秒
3. 将采样结果记录在本次交付说明中；若未达标，优先排查聚合查询与首页初始化链路

## 手工验收场景

### 场景 A：有待复习任务

1. 使用已登录且有待复习数据的用户进入首页
2. 验证首页展示待复习数、今日进度、逾期提示
3. 在 5 秒内确认是否存在待复习任务，并记录是否满足 SC-001 的识别目标
4. 点击“开始复习”，验证能够进入复习模块，并记录从进入首页到触发关键操作是否在 10 秒内完成
5. 验证底部导航当前激活项为首页，点击右下角知识点录入按钮进入 `topic-entry`

### 场景 B：无待复习任务

1. 使用无待复习数据的用户进入首页
2. 验证首页展示空态文案
3. 验证“新建知识点”可正常点击，“开始复习”给出明确反馈而非报错
4. 验证底部导航与右下角知识点录入按钮仍然可用
5. 记录本场景下用户是否仍可在 10 秒内触发至少一个关键操作，用于对照 SC-002

### 场景 C：弱网或接口失败

1. 模拟首页聚合接口超时或失败
2. 验证首页仍保留关键操作入口
3. 验证页面使用占位或最近一次成功快照做兜底展示

## 上线后指标跟踪

- SC-003：基于 `HomeActionEvent` 中首页入口点击与目标模块启动数据，按周统计首页到目标模块的启动转化率
- SC-005：上线前先记录最近 1 周内关于“找不到下一步操作”的反馈基线；上线后按周汇总同口径工单、群反馈或问卷记录，持续观察 4 周下降幅度

## 关键文件目标

```text
server/src/routes/home.ts
server/src/services/homeService.ts
server/src/models/HomeActionEvent.ts
client/src/pages/home/index.vue
client/src/components/shared/navigation/AppTabBar.vue
client/src/components/shared/navigation/KnowledgeEntryFab.vue
client/src/stores/home.ts
client/src/composables/useHome.ts
```
