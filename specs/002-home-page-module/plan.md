# Implementation Plan: 首页模块

**Branch**: `002-home-page` | **Date**: 2026-04-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/002-home-page-module/spec.md`

## Summary

在遵循宪章锁定技术栈的前提下，实现首页作为 APP 核心入口的状态总览、关键操作入口和跨模块引导能力。技术方案采用服务端聚合首页读模型，提供统一 REST 接口；前端在 `client/` 下初始化符合宪章的 unibest 工程并以 Pinia + composables 实现首页渲染与跳转逻辑，同时复用共享底部导航与知识点录入悬浮按钮，并将知识点入口统一收口到 `topic-entry` 路由。

## Technical Context

**Language/Version**: TypeScript（strict mode）, Node.js, Vue 3 `<script setup lang="ts">`  
**Primary Dependencies**: Express 5, cors, dotenv（现有后端）；Mongoose, express-validator, jsonwebtoken, bcryptjs（沿用 001 基础设施）；unibest, Pinia, wot-design-uni, UnoCSS, UnoCSS Icons（前端，按宪章初始化）  
**Storage**: MongoDB（用户/复习/行为事件数据）；客户端本地存储用于登录态与首页最近一次成功快照  
**Testing**: `tsc` 编译校验、API 契约校验、基于 spec 的手工验收场景；实现阶段需补齐 client/server 的 lint 脚本以满足宪章门禁  
**Target Platform**: uni-app 移动端 APP + Node.js REST API 服务  
**Project Type**: Mobile App + Web Service  
**Performance Goals**: 首页 dashboard 接口在常规网络下 p95 小于 500ms；进入首页后 2 秒内展示可操作入口；满足 spec 中 5 秒识别任务状态与 10 秒触发关键操作目标  
**Constraints**: 必须遵守宪章锁定栈；首页状态不可用时仍保留关键入口；不得在页面中堆叠业务逻辑；当前仓库尚无前端工程与 lint 配置，需在实现阶段补齐  
**Scale/Scope**: 面向 10k 级活跃用户；本特性范围包含 1 个首页聚合接口、1 个首页行为记录接口、1 个首页页面、若干首页组件/store/composable，以及对既有认证基础设施的依赖接入

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原则                   | 状态    | 说明                                                                                                                      |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| I. 前端技术栈锁定      | ✅ PASS | 计划在 `client/` 初始化 unibest + Vue 3 + TypeScript + UnoCSS + UnoCSS Icons + wot-design-uni + Pinia，不引入替代栈       |
| II. 后端技术栈锁定     | ✅ PASS | 首页能力继续使用 Node.js + Express + MongoDB（Mongoose）并通过 `/api` 提供 RESTful JSON 接口                              |
| III. 前端代码纪律      | ✅ PASS | 首页页面仅负责展示和事件绑定，业务逻辑拆分至 `composables/` 与 `stores/`；视觉实现必须依赖 UnoCSS token 与 wot-design-uni |
| IV. 后端代码纪律与安全 | ✅ PASS | 首页接口通过 `routes/` + `services/` 分层实现，使用统一响应封装、参数校验和 Mongoose Model；行为记录不复用 `console.log`  |
| V. 工程治理与发布纪律  | ✅ PASS | 继续在功能分支上规划；计划中明确补齐 lint/build 门禁并沿用 Conventional Commits，当前无设计性违例                         |

**Post-Phase 1 Re-check**: ✅ PASS。`research.md`、`data-model.md`、`contracts/api.md` 与 `quickstart.md` 均保持在宪章允许的技术边界内，没有引入替代框架、非 REST 接口或绕过 Mongoose/统一响应的设计。

## Project Structure

### Documentation (this feature)

```text
specs/002-home-page-module/
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
│   ├── models/
│   │   ├── User.ts
│   │   ├── ReviewTask.ts
│   │   └── HomeActionEvent.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── home.ts
│   │   ├── review.ts
│   │   └── topics.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── homeService.ts
│   │   ├── reviewService.ts
│   │   └── topicService.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validate.ts
│   └── utils/
│       ├── response.ts
│       └── logger.ts

client/
├── UI/
│   └── home.png
├── package.json
├── pages.json
├── uno.config.ts
├── src/
│   ├── pages/
│   │   ├── home/
│   │   ├── review/
│   │   └── topic-entry/
│   ├── components/
│   │   ├── home/
│   │   └── shared/
│   │       └── navigation/
│   │           ├── AppTabBar.vue
│   │           └── KnowledgeEntryFab.vue
│   ├── composables/
│   │   ├── useHome.ts
│   │   └── useNavigation.ts
│   ├── stores/
│   │   ├── user.ts
│   │   └── home.ts
│   ├── utils/
│   │   └── request.ts
│   └── types/
│       └── home.ts
```

**Structure Decision**: 保持仓库现有 `server/` 单独后端结构不变，在 `client/` 下补齐真实前端工程，并保留 `client/UI/` 作为设计稿资源目录。首页后端继续采用 `routes/ -> services/ -> models/` 分层；首页前端采用 `pages/ + components/home + components/shared/navigation + composables + stores` 分层，以满足宪章关于路由、逻辑拆分和统一请求封装的要求。知识点录入目标页统一使用 `topic-entry` 目录命名，首页不再维护独立的 `create-topic` 源码路由。

## Complexity Tracking

> 无宪章违规，无需记录.
