# Implementation Plan: 知识点录入模块

**Branch**: `003-knowledge-entry` | **Date**: 2026-04-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/003-knowledge-entry/spec.md`

## Summary

在遵循宪章锁定技术栈的前提下，实现知识点录入页的一次性创建流程：用户输入纯文字标题后，通过单个受鉴权的 REST 接口完成标题校验、共享标准答案复用或生成、统一判重，以及 6 个固定初始复习节点初始化。后端采用 Express + Mongoose + OpenRouter 服务分层落地，前端采用 unibest 页面 + Pinia/composable 组织录入交互，并将 `topic-entry` 固定为共享知识点录入按钮可复用的唯一目标路由；首页、复习列表和个人中心的按钮接线继续由共享导航模块承接。由于当前仓库仍缺失 001 认证基础设施的实际代码、Mongo 连接分层和真实 `client/` 工程，实施顺序需先补齐底座再落本特性。

## Technical Context

**Language/Version**: TypeScript（strict mode）, Node.js, Vue 3 `<script setup lang="ts">`  
**Primary Dependencies**: Express 5, cors, dotenv, `express-rate-limit`, `@langchain/openrouter`, `@langchain/core`（现有后端）；Mongoose, express-validator, jsonwebtoken, bcryptjs, pino（本特性与 001 基础设施补齐）；unibest, Pinia, wot-design-uni, UnoCSS, UnoCSS Icons（前端，按宪章初始化）  
**Storage**: MongoDB（`User`、`KnowledgePoint`、`SharedStandardAnswer`、`ReviewNode`）；客户端本地存储仅沿用登录态，不新增业务离线库  
**Testing**: 通过 `npm run lint`、`npm run typecheck`、`npm run build` 做工作区门禁；通过 `npm run smoke:topics` 覆盖 `contracts/api.md` 的 `200/401/409/502` 契约路径、共享答案复用/新生成两条成功路径，以及响应耗时采样；再结合 spec 的手工验收场景完成页面与交互核对  
**Target Platform**: uni-app 移动端 APP + Node.js REST API 服务  
**Project Type**: Mobile App + Web Service  
**Performance Goals**: 复用共享答案路径下提交到成功返回 p95 小于 3 秒；生成新答案路径下提交到成功返回 p95 小于 12 秒；成功响应必须一次性携带完整 6 个初始复习节点摘要，并通过结构化耗时日志与契约冒烟采样进行验证  
**Constraints**: 必须遵守宪章锁定栈；标题仅允许 1-30 字纯文字；重复判定按 normalizedTitle / canonicalTitle 两级精确匹配落地；不得向用户呈现部分成功；必须复用 001 提供的 accessToken 签发与登录态存储契约；当前仓库仅有极简 `server/src/index.ts` 和 `client/UI/` 设计资源，实施前需完成分层与工程初始化；生产环境应提供支持事务的 MongoDB，开发环境仅允许在事务不可用时启用手动回滚兜底  
**Scale/Scope**: 面向 10k 级活跃用户；本特性范围包含 1 个知识点创建接口、1 个录入页面、3 个核心持久化实体、1 条 AI 标准答案服务链路，以及对 001 认证与统一响应基础设施的依赖接入

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原则                   | 状态    | 说明                                                                                                                                                          |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. 前端技术栈锁定      | ✅ PASS | 录入页计划在 `client/` 的 unibest 工程中实现，使用 Vue 3 `<script setup lang="ts">`、Pinia、wot-design-uni、UnoCSS、UnoCSS Icons，不引入替代栈                |
| II. 后端技术栈锁定     | ✅ PASS | 继续使用 Node.js + Express + MongoDB（Mongoose）并通过 `/api` 暴露 RESTful JSON 接口，AI 能力仅作为服务层依赖接入                                             |
| III. 前端代码纪律      | ✅ PASS | 页面目录遵循 unibest `pages/<route>/index.vue` 约定，组件文件使用 PascalCase；页面仅负责表单渲染与事件绑定，录入逻辑拆分到 `composables/` 与 `stores/`        |
| IV. 后端代码纪律与安全 | ✅ PASS | 规划 `routes/` + `services/` + `models/` 分层，使用 express-validator、统一响应封装、Mongoose Schema、结构化日志，并在应用初始化统一接入 CORS / Rate Limiting |
| V. 工程治理与发布纪律  | ✅ PASS | 规划仍在功能分支上推进；实施阶段明确补齐 lint/build 门禁、统一日志和 PR 合并流程。当前 Speckit 编号分支仅作为计划产物，不改变宪章对提交流程的约束             |

**Post-Phase 1 Re-check**: ✅ PASS。`research.md`、`data-model.md`、`contracts/api.md` 与 `quickstart.md` 全部维持在宪章允许的技术边界内，没有引入非锁定框架、非 REST 接口、原生 Mongo Driver、错误的页面目录约定、跳过统一响应/参数校验，或遗漏 CORS / Rate Limiting 设计的内容。

## Project Structure

### Documentation (this feature)

```text
specs/003-knowledge-entry/
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
│   │   └── ReviewNode.ts
│   ├── routes/
│   │   └── topics.ts
│   ├── services/
│   │   ├── topicService.ts
│   │   ├── answerService.ts
│   │   └── reviewPlanService.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimit.ts
│   │   └── validate.ts
│   └── utils/
│       ├── response.ts
│       └── logger.ts

client/
├── UI/
│   └── ...design-assets
├── package.json
├── pages.json
├── uno.config.ts
└── src/
    ├── pages/
    │   └── topic-entry/      # 首页/复习列表/个人中心共享录入目标页
    │       └── index.vue
    ├── components/
    │   └── topic-entry/
    │       ├── TopicEntryNavBar.vue
    │       ├── TopicTitleForm.vue
    │       ├── TopicEntryNoticeCard.vue
    │       ├── TopicEntryFooterBar.vue
    │       └── CreationResultCard.vue
    ├── composables/
    │   └── useTopicEntry.ts
    ├── stores/
    │   └── knowledgeEntry.ts
    ├── utils/
    │   └── request.ts
    └── types/
        └── topic.ts
```

**Structure Decision**: 保持仓库现有 `server/` 单独后端结构不变，在 `server/src/` 内补齐宪章要求的配置、模型、路由、服务、中间件与工具分层，并复用 001 提供的鉴权契约；在 `client/` 根目录初始化真实 unibest 工程并保留 `client/UI/` 作为设计稿资源目录。知识点录入后端以 `topics` 路由为入口，分别下沉至 `topicService`、`answerService` 与 `reviewPlanService`，并在应用初始化统一接入 Rate Limiting；前端则以 `pages/ + components/ + composables/ + stores/` 分层承载输入校验、提交流程与结果展示，页面目录遵循 unibest `pages/<route>/index.vue` 约定，避免与设计稿名 `create-topic` 再次漂移。

## Complexity Tracking

> 无宪章违规，无需记录。
