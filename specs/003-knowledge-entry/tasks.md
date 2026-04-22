# Tasks: 知识点录入模块

**Input**: Design documents from `/specs/003-knowledge-entry/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅  
**UI 设计稿**: client/UI/create-topic.png  
**Tests**: 当前规格未要求 TDD 或自动化测试任务，本清单包含实现、API 契约冒烟、性能采样、门禁与手工验收相关任务。

**External Dependency**: 复用 001-user-login-account 提供的 accessToken 签发、持久化与 Bearer 鉴权契约；若 001 未交付，本特性需先补齐最小占位契约后再进入 US2/US3。

**Organization**: 任务按用户故事分组，确保在完成共享基础设施后，每个故事都可以独立实现和验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无未完成依赖）
- **[Story]**: 所属用户故事（US1, US2, US3）
- 描述中包含精确文件路径

---

## Phase 1: Setup（项目初始化）

**Purpose**: 初始化缺失的前端工程骨架、依赖脚本与环境模板

- [ ] T001 初始化 unibest 前端工程骨架并创建基础入口文件 client/package.json、client/pages.json、client/src/App.vue
- [ ] T002 [P] 配置知识点录入页所需 UnoCSS、UnoCSS Icons 和页面视觉 token 于 client/uno.config.ts
- [ ] T003 [P] 补齐知识点录入模块所需后端依赖（含 `express-rate-limit`）与脚本到 server/package.json
- [ ] T004 [P] 创建知识点录入与 AI 调用相关环境变量模板 server/.env.example
- [ ] T005 配置工作区 lint、typecheck、build 与 API 契约冒烟命令到 package.json、client/package.json、server/package.json

**Checkpoint**: client/ 与 server/ 的基础工程入口和质量门禁命令就绪。

---

## Phase 2: Foundational（阻塞性基础设施）

**Purpose**: 所有用户故事共享的认证契约、请求层、后端分层与路由骨架

**⚠️ CRITICAL**: 在本阶段完成前，不应开始任何用户故事实现

**前置依赖**: 001-user-login-account 已提供 accessToken 签发与客户端登录态存储；若未交付，先补齐最小可联调占位契约。

- [ ] T006 在 server/src/index.ts 中接入 `/api` 前缀、JSON/CORS/Rate Limiting 中间件、Mongo 启动与 topics 路由注册骨架
- [ ] T007 [P] 创建环境配置与 MongoDB 连接管理 server/src/config/env.ts、server/src/config/db.ts
- [ ] T008 [P] 创建统一响应封装与结构化日志工具 server/src/utils/response.ts、server/src/utils/logger.ts
- [ ] T009 [P] 创建对接 001 鉴权契约的认证、限流、参数校验与全局错误处理中间件 server/src/middlewares/auth.ts、server/src/middlewares/rateLimit.ts、server/src/middlewares/validate.ts、server/src/middlewares/errorHandler.ts
- [ ] T010 [P] 复用或补齐当前特性依赖的用户模型 server/src/models/User.ts
- [ ] T011 [P] 基于 001 登录态创建带 Token 注入与 401 处理的统一请求层 client/src/utils/request.ts
- [ ] T012 [P] 创建知识点录入领域类型与基础状态容器 client/src/types/topic.ts、client/src/stores/knowledgeEntry.ts
- [ ] T013 [P] 创建知识点录入 composable 骨架与唯一页面路由占位 client/src/composables/useTopicEntry.ts、client/src/pages/topic-entry/index.vue、client/pages.json
- [ ] T014 创建 topics 路由与服务骨架 server/src/routes/topics.ts、server/src/services/topicService.ts、server/src/services/answerService.ts、server/src/services/reviewPlanService.ts

**Checkpoint**: accessToken 契约、Rate Limiting、录入页与 `/api/topics` 的共享骨架完成，用户故事可按优先级推进。

---

## Phase 3: User Story 1 - 录入合法标题并发起创建 (Priority: P1) 🎯

**Goal**: 用户进入知识点录入页后，可看到与设计稿一致的页面，并完成 1-30 字纯文字标题输入、实时校验与提交发起。

**Independent Test**: 打开知识点录入页，对照 client/UI/create-topic.png 验证顶部导航、输入卡片、AI 提示卡和底部 CTA 的视觉一致性；输入合法与非法标题时，页面能独立完成计数、禁用态和校验提示。

### Implementation for User Story 1

- [ ] T015 [P] [US1] 将 create-topic 设计稿中的颜色、圆角、边框、阴影和间距 token 映射到 client/uno.config.ts
- [ ] T016 [P] [US1] 按 client/UI/create-topic.png 像素级还原顶部导航与“返回后数据不保存”提示到 client/src/components/topic-entry/TopicEntryNavBar.vue
- [ ] T017 [P] [US1] 按 client/UI/create-topic.png 像素级还原标题输入卡片到 client/src/components/topic-entry/TopicTitleForm.vue，覆盖标题标签、文本域、placeholder、辅助文案与字数计数器
- [ ] T018 [P] [US1] 按 client/UI/create-topic.png 像素级还原 AI 说明卡片与底部固定提交栏到 client/src/components/topic-entry/TopicEntryNoticeCard.vue、client/src/components/topic-entry/TopicEntryFooterBar.vue，覆盖默认、禁用与按下状态
- [ ] T019 [US1] 在 client/src/composables/useTopicEntry.ts、client/src/stores/knowledgeEntry.ts 中实现 1-30 字纯文字校验、字数统计、按钮可用态和离页未保存确认逻辑
- [ ] T020 [US1] 在 client/src/pages/topic-entry/index.vue 中组装导航、输入卡片、AI 提示卡和底部 CTA，并通过 client/pages.json 将 `topic-entry` 注册为知识点录入页面唯一入口

**Checkpoint**: 录入页面可独立展示与交互，且主视觉和输入状态达到设计稿一致性。

---

## Phase 4: User Story 2 - 获取标准答案与初始复习计划 (Priority: P1)

**Goal**: 用户提交合法标题后，系统能复用或生成共享标准答案，并一次性返回完整的 6 个初始复习节点与最近待复习时间。

**Independent Test**: 分别准备“共享知识库已命中”和“共享知识库未命中”的标题，调用 `POST /api/topics` 并在录入页提交，验证两种路径都能成功返回知识点、标准答案与 6 个复习节点。

### Implementation for User Story 2

- [ ] T021 [P] [US2] 创建用户知识点与共享标准答案模型 server/src/models/KnowledgePoint.ts、server/src/models/SharedStandardAnswer.ts
- [ ] T022 [P] [US2] 创建初始复习节点模型 server/src/models/ReviewNode.ts
- [ ] T023 [US2] 在 server/src/services/answerService.ts 中实现共享答案命中、canonicalTitle/aliases 解析、超时控制与 OpenRouter 标准答案生成链路
- [ ] T024 [US2] 在 server/src/services/reviewPlanService.ts 中实现 `1h / 1d / 3d / 7d / 15d / 30d` 六个初始复习节点生成逻辑
- [ ] T025 [US2] 在 server/src/services/topicService.ts 中实现知识点创建事务、共享答案关联、`firstReviewAt` 计算与成功结果聚合
- [ ] T026 [US2] 在 server/src/routes/topics.ts 中实现 `POST /api/topics` 的鉴权接入、请求校验和 `200/400/401/409/502` 响应映射
- [ ] T027 [P] [US2] 创建成功结果展示卡片 client/src/components/topic-entry/CreationResultCard.vue
- [ ] T028 [US2] 在 client/src/composables/useTopicEntry.ts、client/src/stores/knowledgeEntry.ts、client/src/pages/topic-entry/index.vue 中接入提交 loading、成功态、标准答案摘要与最近一次待复习时间展示

**Checkpoint**: 合法标题提交流程可独立完成，成功结果包含完整标准答案与 6 个初始复习节点摘要。

---

## Phase 5: User Story 3 - 在重复与失败场景下获得清晰反馈 (Priority: P2)

**Goal**: 当用户提交重复或语义相近标题、AI 失败或计划初始化异常时，系统给出明确反馈并保持数据一致。

**Independent Test**: 预置同名或语义相近知识点、模拟 AI 超时和节点写入失败，验证接口返回 `409/502` 或失败结果，前端展示清晰提示，且数据库中不存在半成品知识点与不完整复习计划。

### Implementation for User Story 3

- [ ] T029 [US3] 在 server/src/services/topicService.ts 中实现 `normalizedTitle` 精确匹配 + `canonicalTitle` 精确匹配回退的统一重复检测与 `409 existingKnowledgePoint` 返回
- [ ] T030 [US3] 在 server/src/services/topicService.ts、server/src/services/reviewPlanService.ts 中补齐事务回滚、跨日跨月节点时序保护与部分成功防护
- [ ] T031 [US3] 在 server/src/routes/topics.ts、server/src/utils/response.ts 中映射重复创建、AI 失败和计划初始化失败的错误码与提示文案
- [ ] T032 [P] [US3] 在 client/src/components/topic-entry/TopicTitleForm.vue、client/src/components/topic-entry/CreationResultCard.vue 中实现字段错误、重复提示和失败反馈样式
- [ ] T033 [US3] 在 client/src/composables/useTopicEntry.ts、client/src/stores/knowledgeEntry.ts、client/src/pages/topic-entry/index.vue 中接入 conflict、failure、retry 和离页二次确认交互

**Checkpoint**: 重复创建与失败场景可独立验证，前后端均不会产生误导性成功结果。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 收口视觉 token、日志、门禁与手工验收闭环

- [ ] T034 [P] 在 client/uno.config.ts、client/src/components/topic-entry/TopicEntryNavBar.vue、client/src/components/topic-entry/TopicTitleForm.vue、client/src/components/topic-entry/TopicEntryNoticeCard.vue、client/src/components/topic-entry/TopicEntryFooterBar.vue 中收口页面视觉 token 并移除硬编码色值/阴影
- [ ] T035 [P] 在 server/src/services/answerService.ts、server/src/services/topicService.ts、server/src/utils/logger.ts 中补齐 AI 调用耗时、重复命中、事务失败的结构化日志与性能采样字段
- [ ] T036 [P] 更新知识点录入模块交付说明与手工验收步骤到 specs/003-knowledge-entry/quickstart.md、specs/003-knowledge-entry/plan.md
- [ ] T037 [P] 在 package.json、client/package.json、server/package.json 上跑通 lint、typecheck、build 与 API 契约冒烟门禁并修复剩余缺口
- [ ] T038 在 client/src/pages/topic-entry/index.vue、server/src/routes/topics.ts、server/src/services/topicService.ts 上按 quickstart 与 contracts/api.md 跑通 `200/401/409/502` 手工验收/契约场景，并对共享答案复用/新生成两条路径采样响应耗时

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: 无依赖，可立即开始
- **Phase 2: Foundational**: 依赖 Phase 1 完成，且阻塞所有用户故事
- **Phase 3: US1**: 依赖 Phase 2，用于建立录入页视觉和交互基线
- **Phase 4: US2**: 依赖 Phase 2；后端模型和服务可与 US1 的纯展示组件并行推进，但前端提交成功态整合应在 US1 页面骨架稳定后进行
- **Phase 5: US3**: 依赖 Phase 2；建议在 US2 的创建链路稳定后补齐重复检测、事务回滚和失败提示
- **Phase 6: Polish**: 依赖目标用户故事完成后统一执行

### User Story Dependencies

- **US1 (P1)**: Phase 2 完成后即可开始，是录入页像素级还原与输入交互的最小可交付版本
- **US2 (P1)**: Phase 2 完成后即可并行准备后端创建链路；整合到录入页成功态时与 US1 共享 `client/src/pages/topic-entry/index.vue`
- **US3 (P2)**: 建议在 US2 完成后推进，因为冲突提示、失败回滚和错误映射依赖真实创建链路

### Story Completion Order

```text
Phase 1 Setup
    ↓
Phase 2 Foundational
    ↓
Phase 3 US1: 录入页像素级还原与输入校验
    ↓
Phase 4 US2: 标准答案与初始复习计划生成
    ↓
Phase 5 US3: 重复与失败反馈
    ↓
Phase 6 Polish
```

### Parallel Opportunities

- **Setup**: T002、T003、T004 可并行
- **Foundational**: T007、T008、T009、T010、T011、T012、T013 可并行
- **US1**: T015、T016、T017、T018 可并行
- **US2**: T021、T022、T027 可并行；T023 与 T024 可在模型创建后分头推进
- **US3**: T031、T032 可并行；T033 在前端错误样式稳定后整合
- **Polish**: T034、T035、T036、T037 可并行

---

## Parallel Example: User Story 1

```text
T016 client/src/components/topic-entry/TopicEntryNavBar.vue
T017 client/src/components/topic-entry/TopicTitleForm.vue
T018 client/src/components/topic-entry/TopicEntryNoticeCard.vue + client/src/components/topic-entry/TopicEntryFooterBar.vue
```

## Parallel Example: User Story 2

```text
T021 server/src/models/KnowledgePoint.ts + server/src/models/SharedStandardAnswer.ts
T022 server/src/models/ReviewNode.ts
T027 client/src/components/topic-entry/CreationResultCard.vue
```

## Parallel Example: User Story 3

```text
T031 server/src/routes/topics.ts + server/src/utils/response.ts
T032 client/src/components/topic-entry/TopicTitleForm.vue + client/src/components/topic-entry/CreationResultCard.vue
```

---

## Implementation Strategy

### MVP First

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational
3. 完成 Phase 3: US1
4. 完成 Phase 4: US2
5. **STOP and VALIDATE**: 依据 client/UI/create-topic.png 和 quickstart 场景验证录入页已具备首个完整可交付版本

### Incremental Delivery

1. Setup + Foundational 完成后，录入页与 `/api/topics` 具备可开发骨架
2. 完成 US1，先交付与设计稿一致的录入页面和输入交互
3. 完成 US2，交付真正可用的知识点创建、标准答案与初始计划初始化能力
4. 完成 US3，补齐重复、失败与回滚兜底能力
5. 最后执行 Polish，收敛视觉 token、日志、质量门禁与交付说明

### Suggested MVP Scope

- **建议 MVP 范围**: US1 + US2
- **原因**: 你明确要求按 client/UI/create-topic.png 完成像素级还原，而该页面的核心价值不是静态输入框，而是“输入并保存生成计划”的完整闭环；仅交付 US1 还不足以满足功能性 MVP。

---

## Notes

- 所有录入页视觉实现以 client/UI/create-topic.png 为唯一设计基准
- `create-topic` 仅作为设计稿资源名存在；源码目录、页面路由和跨模块跳转目标统一使用 `topic-entry`
- 所有前端样式必须遵守 constitution 中关于 UnoCSS token、wot-design-uni 复用和禁止硬编码色值/阴影的约束
- 当前未加入自动化测试任务；验收以 quickstart.md 手工场景、API 合同和设计稿对照为主
- 对共享文件 client/src/pages/topic-entry/index.vue、client/src/composables/useTopicEntry.ts、server/src/services/topicService.ts 的改动需按阶段合并，避免跨故事互相覆盖
