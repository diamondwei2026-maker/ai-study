# Tasks: 首页模块

**Input**: Design documents from `/specs/002-home-page-module/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅
**UI 设计稿**: client/UI/home.png
**Tests**: 当前规格未要求 TDD 或自动化测试任务，本清单包含实现、手工验收、API 契约对照与性能/指标验证准备任务。

**Organization**: 任务按用户故事分组，确保在完成共享基础设施后，每个故事都可以独立实现和验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无未完成依赖）
- **[Story]**: 所属用户故事（US1, US2, US3）
- 描述中包含精确文件路径

---

## Phase 1: Setup（项目初始化）

**Purpose**: 初始化缺失的前端工程骨架、依赖脚本与环境模板

- [X] T001 初始化 unibest 前端工程骨架并创建基础入口文件 client/package.json、client/pages.json、client/src/App.vue
- [X] T002 [P] 配置首页所需 UnoCSS、UnoCSS Icons 和主题 token 于 client/uno.config.ts
- [X] T003 [P] 补齐首页模块所需后端依赖与脚本到 server/package.json
- [X] T004 [P] 创建首页模块与认证依赖的环境变量模板 server/.env.example
- [X] T005 配置工作区 lint、typecheck 与 build 命令到 package.json、client/package.json、server/package.json

**Checkpoint**: client/ 与 server/ 的基础工程入口和命令约束就绪

---

## Phase 2: Foundational（阻塞性基础设施）

**Purpose**: 所有用户故事共享的认证、模型、请求层与首页骨架

**⚠️ CRITICAL**: 在本阶段完成前，不应开始任何用户故事实现

**执行顺序说明**: Phase 2 以内显式依赖为准，T006 虽编号较早，但必须在 T007、T008、T015 完成后执行

- [X] T007 [P] 创建统一响应封装与结构化日志工具 server/src/utils/response.ts、server/src/utils/logger.ts
- [X] T008 [P] 创建认证、参数校验与全局错误处理中间件 server/src/middlewares/auth.ts、server/src/middlewares/validate.ts、server/src/middlewares/errorHandler.ts
- [X] T009 [P] 定义首页聚合依赖的用户模型 server/src/models/User.ts
- [X] T010 [P] 定义首页状态统计依赖的复习任务模型 server/src/models/ReviewTask.ts
- [X] T011 [P] 创建带 Token 注入与 401 处理的统一请求层 client/src/utils/request.ts
- [X] T012 [P] 创建持久化用户会话状态 store client/src/stores/user.ts
- [X] T013 [P] 定义首页领域类型与基础状态结构 client/src/types/home.ts、client/src/stores/home.ts
- [X] T014 [P] 创建首页数据与导航 composable 骨架 client/src/composables/useHome.ts、client/src/composables/useNavigation.ts
- [X] T015 创建首页页面壳与首页 API 骨架 client/src/pages/home/index.vue、client/pages.json、server/src/routes/home.ts、server/src/services/homeService.ts
- [X] T006 在 T007、T008、T015 完成后，于 server/src/index.ts 中接入 MongoDB 启动、全局中间件与首页路由注册

**Checkpoint**: 首页共享骨架完成，用户故事可按优先级推进

---

## Phase 3: User Story 1 - 查看复习状态总览 (Priority: P1) 🎯

**Goal**: 已登录用户进入首页即可看到清晰的复习状态总览，并在弱网或异常场景下仍能理解当前状态

**Independent Test**: 使用存在待复习、无待复习和存在逾期任务的账号分别进入首页，验证状态摘要、逾期强调和兜底状态可独立工作

### Implementation for User Story 1

- [X] T016 [US1] 在 server/src/services/homeService.ts 中实现 reviewStatus、generatedAt 与统计汇总聚合逻辑
- [X] T017 [US1] 在 server/src/routes/home.ts 中实现 GET /api/home/dashboard 的鉴权接入与响应映射
- [X] T018 [P] [US1] 按 client/UI/home.png 像素级还原首页顶部品牌区于 client/src/components/home/HomeHeroHeader.vue
- [X] T019 [P] [US1] 按 client/UI/home.png 像素级还原今日学习状态卡片于 client/src/components/home/HomeStatusCard.vue，覆盖待复习数、逾期数、分隔线、字体层级与圆角边框
- [X] T020 [P] [US1] 在 client/src/composables/useHome.ts、client/src/stores/home.ts 中实现 loading、empty、overdue、unavailable 与最近一次成功快照兜底状态
- [X] T021 [US1] 在 client/src/pages/home/index.vue 中组装首页顶部渐变背景、品牌区、状态卡片和首屏布局，并通过 client/pages.json 注册首页入口

**Checkpoint**: 首页状态总览可独立展示，且视觉与设计稿上半屏保持一致

---

## Phase 4: User Story 2 - 快速进入关键操作 (Priority: P1)

**Goal**: 用户可从首页直接进入复习与新建知识点流程，且关键操作区保持像素级还原和可追踪性

**Independent Test**: 进入首页后点击“开始复习”与“新建知识点”，验证可直达目标页面、无任务时有反馈、点击行为可被记录

### Implementation for User Story 2

- [X] T022 [US2] 创建首页关键操作事件模型 server/src/models/HomeActionEvent.ts
- [X] T023 [US2] 在 server/src/services/homeService.ts、server/src/routes/home.ts 中实现 POST /api/home/action-events 写入链路
- [X] T024 [P] [US2] 按 client/UI/home.png 像素级还原首页紫色主操作卡片于 client/src/components/home/HomePrimaryActionCard.vue，覆盖默认、按下、禁用与空任务状态
- [X] T025 [P] [US2] 在 client/src/components/shared/navigation/KnowledgeEntryFab.vue、client/src/components/shared/navigation/AppTabBar.vue、client/src/pages/home/index.vue 中实现首页态的悬浮新建按钮与底部 TabBar 接入，覆盖尺寸、阴影、圆角、activeTab=home、未激活态和跳转 `topic-entry`
- [X] T026 [P] [US2] 创建首页快捷入口目标页 client/src/pages/review/index.vue，并将“新建知识点”入口统一指向 client/src/pages/topic-entry/index.vue
- [X] T027 [US2] 在 client/src/composables/useNavigation.ts、client/src/pages/home/index.vue 中接入关键操作跳转与点击事件上报
- [X] T028 [US2] 在 client/src/composables/useHome.ts、client/src/components/home/HomePrimaryActionCard.vue 中实现无待复习任务反馈与目标路由可用性保护

**Checkpoint**: 首页关键操作区可独立工作，页面主视觉与交互入口达到设计稿一致性

---

## Phase 5: User Story 3 - 跨模块任务引导 (Priority: P2)

**Goal**: 首页根据用户状态显示明确的下一步建议，并在跨模块往返后保持建议与状态一致

**Independent Test**: 构造新用户、待复习用户与已完成当日任务用户，验证首页建议条内容、推荐动作高亮与跨模块返回刷新独立成立

### Implementation for User Story 3

- [X] T029 [US3] 在 server/src/services/homeService.ts 中实现 guidance 规则计算与 suggestedActionKey 生成逻辑
- [X] T030 [P] [US3] 按 client/UI/home.png 像素级还原橙色关注提示条并扩展不同建议样式到 client/src/components/home/HomeGuidanceBanner.vue
- [X] T031 [P] [US3] 在 client/src/stores/home.ts、client/src/types/home.ts 中扩展建议优先级、跨模块返回刷新标记与最近动作上下文
- [X] T032 [US3] 在 client/src/pages/home/index.vue、client/src/composables/useHome.ts 中接入建议条排序、推荐动作高亮与页面显示时刷新
- [X] T033 [US3] 在 client/src/pages/review/index.vue、client/src/pages/topic-entry/index.vue、client/src/composables/useHome.ts 中实现跨模块返回后的首页状态一致性刷新

**Checkpoint**: 首页引导建议与跨模块衔接可独立验证，橙色提醒区与推荐动作行为成立

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 完成视觉 token 收口、日志补强与手工验收闭环

- [ ] T034 [P] 在 client/uno.config.ts、client/src/components/home/HomeHeroHeader.vue、client/src/components/home/HomeStatusCard.vue、client/src/components/home/HomeGuidanceBanner.vue、client/src/components/home/HomePrimaryActionCard.vue、client/src/components/shared/navigation/KnowledgeEntryFab.vue、client/src/components/shared/navigation/AppTabBar.vue 中收口首页视觉 token 并移除硬编码样式值
- [X] T035 [P] 在 server/src/services/homeService.ts、server/src/utils/logger.ts 中补齐 dashboard 读取失败与 action-event 写入失败的结构化日志
- [X] T036 [P] 更新首页模块交付说明、成功标准测量口径与手工验收步骤到 specs/002-home-page-module/quickstart.md、specs/002-home-page-module/plan.md
- [ ] T037 在 client/src/pages/home/index.vue、server/src/routes/home.ts 上跑通 quickstart 手工验收场景并修复遗留缺口
- [X] T038 [P] 依据 specs/002-home-page-module/contracts/api.md 对照 server/src/routes/home.ts、server/src/services/homeService.ts 完成 dashboard 与 action-events 契约校验
- [ ] T039 [P] 对 GET /api/home/dashboard 执行 10 次本地采样并记录 p95，同时记录首页首屏关键操作可点击耗时，结果回填 specs/002-home-page-module/quickstart.md
- [ ] T040 [P] 记录 SC-005 上线前反馈基线，并在 specs/002-home-page-module/quickstart.md、specs/002-home-page-module/plan.md 中固化周度复盘口径与输出物

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: 无依赖，可立即开始
- **Phase 2: Foundational**: 依赖 Phase 1 完成，且阻塞所有用户故事
- **Phase 3: US1**: 依赖 Phase 2，建立首页状态总览与页面视觉基线
- **Phase 4: US2**: 依赖 Phase 2；建议在 US1 建立页面基线后合入，以减少 client/src/pages/home/index.vue 冲突
- **Phase 5: US3**: 依赖 Phase 2；建议在 US1 的 dashboard 结构稳定后实现 guidance 逻辑
- **Phase 6: Polish**: 依赖目标用户故事完成后统一执行

### User Story Dependencies

- **US1 (P1)**: Phase 2 完成后即可开始，是首页最小可读版本
- **US2 (P1)**: Phase 2 完成后即可并行准备组件与目标页，但整合首页页面时需与 US1 协调
- **US3 (P2)**: 依赖 dashboard 数据结构稳定，建议在 US1 完成后推进；与 US2 的导航回流逻辑有轻度集成关系

### Story Completion Order

```text
Phase 1 Setup
    ↓
Phase 2 Foundational
    ↓
Phase 3 US1: 首页状态总览
    ↓
Phase 4 US2: 首页关键操作
    ↓
Phase 5 US3: 跨模块任务引导
    ↓
Phase 6 Polish
```

### Parallel Opportunities

- **Setup**: T002、T003、T004 可并行
- **Foundational**: T007、T008、T009、T010、T011、T012、T013、T014 可并行
- **US1**: T018、T019、T020 可并行
- **US2**: T024、T025、T026 可并行
- **US3**: T030、T031 可并行
- **Polish**: T034、T035、T036 可并行
- **Polish**: T034、T035、T036、T038、T039、T040 可并行

---

## Parallel Example: User Story 1

```text
T018 client/src/components/home/HomeHeroHeader.vue
T019 client/src/components/home/HomeStatusCard.vue
T020 client/src/composables/useHome.ts + client/src/stores/home.ts
```

## Parallel Example: User Story 2

```text
T024 client/src/components/home/HomePrimaryActionCard.vue
T025 client/src/components/shared/navigation/KnowledgeEntryFab.vue + client/src/components/shared/navigation/AppTabBar.vue + client/src/pages/home/index.vue
T026 client/src/pages/review/index.vue + client/src/pages/topic-entry/index.vue
```

---

## Implementation Strategy

### MVP First

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational
3. 完成 Phase 3: US1
4. 完成 Phase 4: US2
5. **STOP and VALIDATE**: 依据 client/UI/home.png 与 quickstart 场景验证首页已达到首个完整可交付版本

### Incremental Delivery

1. Setup + Foundational 完成后，首页具备可开发骨架
2. 完成 US1，先交付“看得清状态”的首页版本
3. 完成 US2，交付与设计稿一致的关键操作入口与页面主体视觉
4. 完成 US3，补齐建议条和跨模块引导能力
5. 最后执行 Polish，收敛视觉 token、日志与交付说明

### Suggested MVP Scope

- **建议 MVP 范围**: US1 + US2
- **原因**: 你明确要求按 client/UI/home.png 完成首页像素级还原，而设计稿中的主操作卡片、悬浮按钮和底部 TabBar 属于首页主视觉的一部分，仅完成 US1 还不足以形成完整页面交付

---

## Notes

- 所有首页视觉实现以 client/UI/home.png 为唯一设计基准
- 所有前端样式必须遵守 constitution 中关于 UnoCSS token、wot-design-uni 复用和禁止硬编码色值/阴影的约束
- 当前未加入自动化测试任务；验收以 quickstart.md 手工场景和设计稿对照为主
- 契约校验、性能采样与 SC-001/SC-002 测量属于本期交付的一部分；SC-003 与 SC-005 作为上线后指标跟踪
- 底部导航与悬浮知识点录入按钮必须复用 client/src/components/shared/navigation/，不得新增 home 专属副本
- 对共享文件 client/src/pages/home/index.vue、client/src/components/shared/navigation/AppTabBar.vue、client/src/components/shared/navigation/KnowledgeEntryFab.vue、server/src/services/homeService.ts 的改动需按阶段合并，避免跨故事互相覆盖
