# Tasks: 复习全流程模块

**Input**: Design documents from `/specs/004-review-flow/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅  
**UI 设计稿**: client/UI/review-list.png、client/UI/feynman-output.png  
**Tests**: 当前规格未要求 TDD 或自动化测试任务，本清单仅包含实现、门禁与手工验收相关任务。

**Organization**: 任务按用户故事分组，确保在完成共享基础设施后，每个故事都可以独立实现和验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无未完成依赖）
- **[Story]**: 所属用户故事（US1, US2, US3）
- 描述中包含精确文件路径

---

## Phase 1: Setup（项目初始化）

**Purpose**: 初始化缺失的前端工程骨架、依赖脚本与环境模板

- [ ] T001 初始化 unibest 前端工程骨架并创建基础入口文件 client/package.json、client/pages.json、client/src/App.vue
- [ ] T002 [P] 配置复习模块所需 UnoCSS、UnoCSS Icons 和页面视觉 token 于 client/uno.config.ts
- [ ] T003 [P] 补齐复习模块所需后端依赖与脚本到 server/package.json
- [ ] T004 [P] 创建复习模块与 AI 调用相关环境变量模板 server/.env.example
- [ ] T005 配置工作区 lint、typecheck 与 build 命令到 package.json、client/package.json、server/package.json

**Checkpoint**: client/ 与 server/ 的基础工程入口和质量门禁命令就绪。

---

## Phase 2: Foundational（阻塞性基础设施）

**Purpose**: 所有用户故事共享的认证、请求层、后端分层、模型基础与路由骨架

**⚠️ CRITICAL**: 在本阶段完成前，不应开始任何用户故事实现

- [ ] T006 在 server/src/index.ts 中接入 `/api` 前缀、JSON/CORS 中间件、Mongo 启动与 review 路由注册骨架
- [ ] T007 [P] 创建环境配置与 MongoDB 连接管理 server/src/config/env.ts、server/src/config/db.ts
- [ ] T008 [P] 创建统一响应封装与结构化日志工具 server/src/utils/response.ts、server/src/utils/logger.ts
- [ ] T009 [P] 创建认证、参数校验与全局错误处理中间件 server/src/middlewares/auth.ts、server/src/middlewares/validate.ts、server/src/middlewares/errorHandler.ts
- [ ] T010 [P] 落地 004 依赖的基础模型 server/src/models/User.ts、server/src/models/KnowledgePoint.ts、server/src/models/SharedStandardAnswer.ts
- [ ] T011 [P] 扩展复习节点与尝试模型 server/src/models/ReviewNode.ts、server/src/models/ReviewAttempt.ts
- [ ] T012 [P] 创建带 Token 注入与 401 处理的统一请求层 client/src/utils/request.ts
- [ ] T013 [P] 创建复习领域类型与基础状态容器 client/src/types/review.ts、client/src/stores/review.ts
- [ ] T014 [P] 创建复习列表、复习会话与通知调度 composable 骨架 client/src/composables/useReviewList.ts、client/src/composables/useReviewSession.ts、client/src/composables/useReviewNotifications.ts
- [ ] T015 [P] 创建复习页面路由壳与通知工具占位 client/src/pages/review/index.vue、client/src/pages/review-session/index.vue、client/src/utils/notification.ts、client/pages.json
- [ ] T016 创建 review 路由与服务骨架 server/src/routes/review.ts、server/src/services/reviewListService.ts、server/src/services/reviewExecutionService.ts、server/src/services/reviewPlanningService.ts、server/src/services/aiReviewService.ts、server/src/services/reminderPolicyService.ts

**Checkpoint**: 复习页面与 `/api/reviews/*` 的共享骨架完成，用户故事可按优先级推进。

---

## Phase 3: User Story 1 - 完成一次复习闭环 (Priority: P1) 🎯

**Goal**: 用户可以从复习任务进入费曼页面，完成纯文字输出、AI 判定、结果展示、计划调整和返回列表的完整闭环。

**Independent Test**: 使用一个到期待复习任务进入费曼页面，对照 client/UI/feynman-output.png 验证页面视觉一致性；输入合法文本后提交，验证 AI 结果、原因说明、任务状态更新和返回列表可独立完成。

### Implementation for User Story 1

- [ ] T017 [US1] 在 server/src/services/aiReviewService.ts 中实现 `MASTERED/FUZZY/UNMASTERED` 三类结构化 AI 判定与原因生成逻辑
- [ ] T018 [US1] 在 server/src/services/reviewPlanningService.ts 中实现 A 方案渐进调整矩阵、24 小时短期补强节点和 30 天延展节点生成逻辑
- [ ] T019 [US1] 在 server/src/services/reviewExecutionService.ts 中实现费曼提交事务、`ReviewAttempt` 写入、当前 `ReviewNode` 状态更新和 follow-up 节点创建
- [ ] T020 [US1] 在 server/src/routes/review.ts 中实现 `GET /api/reviews/tasks/:taskId` 和 `POST /api/reviews/tasks/:taskId/submit` 的鉴权接入、请求校验和 `200/400/404/409/502` 响应映射
- [ ] T021 [P] [US1] 按 client/UI/feynman-output.png 像素级还原顶部导航、知识点标题区和进度线到 client/src/components/review/FeynmanHeader.vue
- [ ] T022 [P] [US1] 按 client/UI/feynman-output.png 像素级还原过期提示卡与费曼要求卡到 client/src/components/review/FeynmanTaskBanner.vue、client/src/components/review/FeynmanPromptCard.vue
- [ ] T023 [P] [US1] 按 client/UI/feynman-output.png 像素级还原输入区、字数提示、底部提交栏与结果弹层到 client/src/components/review/FeynmanComposer.vue、client/src/components/review/ReviewResultSheet.vue、client/src/pages/review-session/index.vue，覆盖默认、输入中、禁用、提交中和成功态
- [ ] T024 [US1] 在 client/src/composables/useReviewSession.ts、client/src/stores/review.ts、client/src/pages/review-session/index.vue 中接入非空校验、草稿保存、提交 loading、结果展示和成功后返回列表逻辑

**Checkpoint**: 费曼复习页和提交闭环可独立运行，且视觉与设计稿一致。

---

## Phase 4: User Story 2 - 管理提醒与过期任务 (Priority: P1)

**Goal**: 用户可以在复习列表中查看待复习与过期任务，并通过本地提醒和列表跳转进入对应复习页面。

**Independent Test**: 构造待复习、短期过期、中期过期和长期过期任务，对照 client/UI/review-list.png 验证列表视觉一致性；验证 `GET /api/reviews/tasks`、本地提醒调度和通知点击跳转都能独立工作。

### Implementation for User Story 2

- [ ] T025 [US2] 在 server/src/services/reviewListService.ts 中实现复习列表聚合、待复习/过期/全部分组、过期等级判定和排序规则
- [ ] T026 [US2] 在 server/src/services/reminderPolicyService.ts 中实现到期前 30 分钟提醒、过期后 1 小时和 24 小时追加提醒、以及未触发提醒取消策略
- [ ] T027 [US2] 在 server/src/routes/review.ts 中实现 `GET /api/reviews/tasks` 的查询参数解析、summary/reminderPolicy/tasks 响应映射
- [ ] T028 [P] [US2] 在 client/src/utils/notification.ts、client/src/composables/useReviewNotifications.ts 中实现本地提醒调度、元数据持久化、应用启动重建和通知点击跳转
- [ ] T029 [P] [US2] 按 client/UI/review-list.png 像素级还原渐变顶部区、标题、过期统计胶囊和分段切换栏到 client/src/components/review/ReviewListHeader.vue、client/src/components/review/ReviewTabs.vue
- [ ] T030 [P] [US2] 按 client/UI/review-list.png 像素级还原空态区、主操作按钮、悬浮加号按钮和底部导航区到 client/src/components/review/ReviewEmptyState.vue、client/src/components/review/ReviewFloatingCreateButton.vue、client/src/components/review/ReviewBottomNavBar.vue，覆盖默认、按下和激活态
- [ ] T031 [P] [US2] 按 client/UI/review-list.png 扩展可复用的任务卡样式到 client/src/components/review/ReviewTaskCard.vue，覆盖待复习、短期过期、中期过期和长期过期视觉状态
- [ ] T032 [US2] 在 client/src/composables/useReviewList.ts、client/src/stores/review.ts、client/src/pages/review/index.vue 中接入列表拉取、tab 切换、空态切换、任务点击进入费曼页和通知返回后的刷新逻辑

**Checkpoint**: 复习列表、过期分类和本地提醒链路可独立验证，且页面主视觉与设计稿一致。

---

## Phase 5: User Story 3 - 获得异常与风险提示 (Priority: P2)

**Goal**: 当任务积压、重复过期或 AI/状态更新失败时，用户能看到明确风险提示，并且系统保持任务状态和草稿一致。

**Independent Test**: 构造单个知识点累计过期 3 次、总过期任务超过 10 个、AI 判定失败和任务状态冲突场景，验证置顶提醒、全局弹窗、失败提示和重试逻辑可独立成立。

### Implementation for User Story 3

- [ ] T033 [US3] 在 server/src/services/reviewListService.ts 中实现累计过期次数聚合、`isPinned` 置顶标记和 `showOverdueAlert` 风险摘要返回
- [ ] T034 [US3] 在 server/src/services/reviewExecutionService.ts、server/src/routes/review.ts、server/src/utils/response.ts 中补齐 AI 失败、事务回滚失败和任务状态冲突的错误映射与兜底返回
- [ ] T035 [P] [US3] 在 client/src/components/review/ReviewRiskBanner.vue、client/src/components/review/ReviewResultSheet.vue 中实现过期超 10 提示、失败提示和重试按钮样式
- [ ] T036 [P] [US3] 在 client/src/composables/useReviewNotifications.ts、client/src/utils/notification.ts 中处理通知权限拒绝、失效任务通知点击和提醒取消后的前端降级行为
- [ ] T037 [US3] 在 client/src/composables/useReviewList.ts、client/src/composables/useReviewSession.ts、client/src/stores/review.ts、client/src/pages/review/index.vue、client/src/pages/review-session/index.vue 中接入置顶任务展示、风险弹窗、失败后草稿恢复和重试逻辑

**Checkpoint**: 风险提示与失败兜底可独立验证，系统不会出现误导性成功状态。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 收口视觉 token、日志、门禁与手工验收闭环

- [ ] T038 [P] 在 client/uno.config.ts、client/src/components/review/FeynmanHeader.vue、client/src/components/review/FeynmanTaskBanner.vue、client/src/components/review/FeynmanPromptCard.vue、client/src/components/review/FeynmanComposer.vue、client/src/components/review/ReviewResultSheet.vue、client/src/components/review/ReviewTabs.vue、client/src/components/review/ReviewTaskCard.vue、client/src/components/review/ReviewEmptyState.vue、client/src/components/review/ReviewRiskBanner.vue、client/src/pages/review/index.vue、client/src/pages/review-session/index.vue 中收口视觉 token 并移除硬编码色值/阴影
- [ ] T039 [P] 在 server/src/services/aiReviewService.ts、server/src/services/reviewExecutionService.ts、server/src/services/reviewListService.ts、server/src/services/reminderPolicyService.ts、server/src/utils/logger.ts 中补齐 AI 判定、提醒重建、状态冲突和事务回滚的结构化日志
- [ ] T040 [P] 更新复习全流程模块交付说明与手工验收步骤到 specs/004-review-flow/quickstart.md、specs/004-review-flow/plan.md
- [ ] T041 [P] 在 package.json、client/package.json、server/package.json 上跑通 lint、typecheck 与 build 门禁并修复剩余缺口
- [ ] T042 在 client/src/pages/review/index.vue、client/src/pages/review-session/index.vue、server/src/routes/review.ts、server/src/services/reviewExecutionService.ts 上跑通 quickstart 手工验收场景并修复遗留缺口

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: 无依赖，可立即开始
- **Phase 2: Foundational**: 依赖 Phase 1 完成，且阻塞所有用户故事
- **Phase 3: US1**: 依赖 Phase 2，用于建立费曼复习闭环与 AI 判定主链路
- **Phase 4: US2**: 依赖 Phase 2；后端列表聚合与提醒策略可和 US1 并行推进，但复习列表与复习会话整合时需与 US1 共用 review store 和页面路由
- **Phase 5: US3**: 依赖 Phase 2；建议在 US1 和 US2 的主链路稳定后补齐风险提示、失败回滚和权限降级行为
- **Phase 6: Polish**: 依赖目标用户故事完成后统一执行

### User Story Dependencies

- **US1 (P1)**: Phase 2 完成后即可开始，是复习执行和 AI 反馈的最小可交付版本
- **US2 (P1)**: Phase 2 完成后即可并行准备列表与提醒链路；整合列表跳转和返回刷新时与 US1 共享 review store
- **US3 (P2)**: 建议在 US1、US2 完成后推进，因为置顶、风险提示和失败兜底依赖真实的列表聚合与提交流程

### Story Completion Order

```text
Phase 1 Setup
    ↓
Phase 2 Foundational
    ↓
Phase 3 US1: 费曼复习闭环
    ↓
Phase 4 US2: 复习列表与本地提醒
    ↓
Phase 5 US3: 风险提示与失败兜底
    ↓
Phase 6 Polish
```

### Parallel Opportunities

- **Setup**: T002、T003、T004 可并行
- **Foundational**: T007、T008、T009、T010、T011、T012、T013、T014、T015 可并行
- **US1**: T021、T022、T023 可并行
- **US2**: T028、T029、T030、T031 可并行
- **US3**: T035、T036 可并行
- **Polish**: T038、T039、T040、T041 可并行

---

## Parallel Example: User Story 1

```text
T021 client/src/components/review/FeynmanHeader.vue
T022 client/src/components/review/FeynmanTaskBanner.vue + client/src/components/review/FeynmanPromptCard.vue
T023 client/src/components/review/FeynmanComposer.vue + client/src/components/review/ReviewResultSheet.vue + client/src/pages/review-session/index.vue
```

## Parallel Example: User Story 2

```text
T028 client/src/utils/notification.ts + client/src/composables/useReviewNotifications.ts
T029 client/src/components/review/ReviewListHeader.vue + client/src/components/review/ReviewTabs.vue
T030 client/src/components/review/ReviewEmptyState.vue + client/src/components/review/ReviewFloatingCreateButton.vue + client/src/components/review/ReviewBottomNavBar.vue
T031 client/src/components/review/ReviewTaskCard.vue
```

## Parallel Example: User Story 3

```text
T035 client/src/components/review/ReviewRiskBanner.vue + client/src/components/review/ReviewResultSheet.vue
T036 client/src/composables/useReviewNotifications.ts + client/src/utils/notification.ts
```

---

## Implementation Strategy

### MVP First

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational
3. 完成 Phase 3: US1
4. **STOP and VALIDATE**: 依据 client/UI/feynman-output.png 和 quickstart 场景验证费曼复习闭环已具备首个可交付版本

### Incremental Delivery

1. Setup + Foundational 完成后，复习页面与 `/api/reviews/*` 具备可开发骨架
2. 完成 US1，先交付从任务进入费曼页到 AI 结果返回的核心闭环
3. 完成 US2，交付像素级还原的复习列表页和本地提醒链路
4. 完成 US3，补齐风险提示、失败回滚和权限降级兜底能力
5. 最后执行 Polish，收敛视觉 token、日志、质量门禁与交付说明

### Suggested MVP Scope

- **建议 MVP 范围**: US1
- **原因**: US1 已经能独立交付“执行一次复习并得到新计划”的核心业务价值；US2 和 US3 主要增强任务入口效率、提醒覆盖和异常兜底。

---

## Notes

- 所有复习模块视觉实现以 client/UI/feynman-output.png 和 client/UI/review-list.png 为唯一设计基准
- 所有前端样式必须遵守 constitution 中关于 UnoCSS token、wot-design-uni 复用和禁止硬编码色值/阴影的约束
- 当前未加入自动化测试任务；验收以 quickstart.md 手工场景、API 合同和设计稿对照为主
- 对共享文件 client/src/pages/review/index.vue、client/src/pages/review-session/index.vue、client/src/composables/useReviewList.ts、client/src/composables/useReviewSession.ts、server/src/routes/review.ts、server/src/services/reviewExecutionService.ts 的改动需按阶段合并，避免跨故事互相覆盖
