# Implementation Plan: 复习全流程模块

**Branch**: `004-review-flow` | **Date**: 2026-04-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/004-review-flow/spec.md`

## Summary

在遵循宪章锁定技术栈的前提下，实现复习列表与费曼复习页面构成的完整复习闭环：服务端以 `ReviewNode` 作为复习任务调度真源，负责过期分级、AI 判定、渐进式计划调整和任务状态更新；客户端在 unibest 工程中实现复习列表页与费曼输出页，并根据任务提醒策略调度本地通知。由于当前仓库仍缺失 001 的认证底座、003 的真实数据模型实现以及 `client/` 下的可运行前端工程，实施顺序需先补齐基础设施，再落 004 的提醒、执行、判定与计划调整链路。

## Technical Context

**Language/Version**: TypeScript（strict mode）, Node.js, Vue 3 `<script setup lang="ts">`  
**Primary Dependencies**: Express 5, cors, dotenv, `@langchain/openrouter`, `@langchain/core`（现有后端）；Mongoose, express-validator, jsonwebtoken, bcryptjs, pino（本特性与 001/003 基础设施补齐）；unibest, Pinia, wot-design-uni, UnoCSS, UnoCSS Icons（前端，按宪章初始化）；uni-app 本地通知能力（前端提醒调度）  
**Storage**: MongoDB（`User`、`KnowledgePoint`、`SharedStandardAnswer`、`ReviewNode`、`ReviewAttempt`）；客户端本地存储用于登录态、提醒调度元数据和费曼输入草稿  
**Testing**: server/client `tsc` 编译校验、API 契约校验、基于 spec 的手工验收场景；实施阶段需补齐 lint 脚本和提醒联调检查以满足宪章零错误门禁  
**Target Platform**: uni-app 移动端 APP + Node.js REST API 服务  
**Project Type**: Mobile App + Web Service  
**Performance Goals**: 复习列表接口在常规网络下 p95 小于 800ms；费曼提交到 AI 结果返回 p95 小于 15 秒；应用启动后 5 秒内完成本地提醒重建；通知点击到进入目标复习页不超过 2 秒  
**Constraints**: 必须遵守宪章锁定栈；费曼输出仅允许非空纯文字；提醒仅允许 1 次到期前提醒和 2 次过期追加提醒；过期任务不得自动删除；AI 或状态更新失败不得产生部分成功；当前仓库仅有极简 `server/src/index.ts` 和 `client/UI/` 设计资源，实施前需完成分层与工程初始化  
**Scale/Scope**: 面向 10k 级活跃用户；本特性范围包含 1 个复习列表页、1 个费曼复习页、3 个核心复习接口、1 条本地提醒调度链路、1 条 AI 判定链路，以及对 003 知识点与初始复习节点数据的承接

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原则                   | 状态    | 说明                                                                                                                                                           |
| ---------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. 前端技术栈锁定      | ✅ PASS | 复习列表页和费曼页计划在 `client/` 的 unibest 工程中实现，使用 Vue 3 `<script setup lang="ts">`、Pinia、wot-design-uni、UnoCSS、UnoCSS Icons，不引入替代栈     |
| II. 后端技术栈锁定     | ✅ PASS | 继续使用 Node.js + Express + MongoDB（Mongoose）并通过 `/api` 暴露 RESTful JSON 接口，AI 判定与计划调整都在服务层完成                                          |
| III. 前端代码纪律      | ✅ PASS | 页面只承担渲染和事件绑定，复习列表、费曼输入和通知调度逻辑拆分至 `composables/`、`stores/` 与 `utils/`；视觉实现沿用 UnoCSS token 与组件库                     |
| IV. 后端代码纪律与安全 | ✅ PASS | 规划 `routes/` + `services/` + `models/` 分层，使用 express-validator、统一响应封装、Mongoose Schema、结构化日志与鉴权中间件，不在路由层直接处理 AI/数据库事务 |
| V. 工程治理与发布纪律  | ✅ PASS | 规划继续在功能分支上推进；实施阶段明确补齐 lint/build 门禁、提醒联调检查和 PR 合并流程，不引入违反宪章的工程例外                                               |

**Post-Phase 1 Re-check**: ✅ PASS。`research.md`、`data-model.md`、`contracts/api.md` 与 `quickstart.md` 全部维持在宪章允许的技术边界内，没有引入替代框架、非 REST 接口、原生 Mongo Driver、页面内重业务逻辑或跳过统一响应/参数校验的设计。

## Project Structure

### Documentation (this feature)

```text
specs/004-review-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── index.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── db.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── KnowledgePoint.ts
│   │   ├── SharedStandardAnswer.ts
│   │   ├── ReviewNode.ts
│   │   └── ReviewAttempt.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── topics.ts
│   │   └── review.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── topicService.ts
│   │   ├── aiReviewService.ts
│   │   ├── reviewListService.ts
│   │   ├── reviewExecutionService.ts
│   │   ├── reviewPlanningService.ts
│   │   └── reminderPolicyService.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validate.ts
│   └── utils/
│       ├── response.ts
│       └── logger.ts

client/
├── UI/
│   ├── review-list.png
│   └── feynman-output.png
├── package.json
├── pages.json
├── uno.config.ts
└── src/
    ├── pages/
    │   ├── review/
    │   │   └── index.vue
    │   └── review-session/
    │       └── index.vue
    ├── components/
    │   └── review/
    │       ├── ReviewTabs.vue
    │       ├── ReviewTaskCard.vue
    │       ├── ReviewRiskBanner.vue
    │       ├── ReviewEmptyState.vue
    │       ├── FeynmanHeader.vue
    │       ├── FeynmanTaskBanner.vue
    │       ├── FeynmanPromptCard.vue
    │       ├── FeynmanComposer.vue
    │       └── ReviewResultSheet.vue
    ├── composables/
    │   ├── useReviewList.ts
    │   ├── useReviewSession.ts
    │   └── useReviewNotifications.ts
    ├── stores/
    │   ├── user.ts
    │   └── review.ts
    ├── utils/
    │   ├── request.ts
    │   └── notification.ts
    └── types/
        └── review.ts
```

**Structure Decision**: 保持仓库现有 `server/` 单独后端结构不变，在 `server/src/` 内补齐宪章要求的配置、模型、路由、服务、中间件与工具分层；在 `client/` 根目录初始化真实 unibest 工程并保留 `client/UI/` 作为设计稿资源目录。复习链路以 `review` 路由为入口，分别下沉至列表聚合、执行提交、AI 判定、计划调整与提醒策略服务；前端则以 `pages/ + components/ + composables/ + stores/` 分层承载 review-list.png 与 feynman-output.png 两个核心页面，以及本地提醒调度。

## Complexity Tracking

> 无宪章违规，无需记录。
