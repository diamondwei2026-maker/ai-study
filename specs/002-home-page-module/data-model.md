# Data Model: 首页模块

**Feature**: 002-home-page-module  
**Date**: 2026-04-21

## Entities

### HomeDashboard（首页读模型，非持久化）

| 字段           | 类型                   | 必填 | 来源        | 说明                   |
| -------------- | ---------------------- | ---- | ----------- | ---------------------- |
| userId         | ObjectId               | 是   | JWT / User  | 当前用户标识           |
| reviewStatus   | ReviewStatusSummary    | 是   | 聚合        | 首页展示的复习状态摘要 |
| primaryActions | PrimaryActionEntry[]   | 是   | 配置 + 聚合 | 首页关键操作入口列表   |
| guidance       | HomeGuidanceSuggestion | 是   | 规则计算    | 首页优先行动建议       |
| generatedAt    | Date                   | 是   | 服务端生成  | 本次首页读模型生成时间 |

**说明**:

- `HomeDashboard` 由服务端聚合返回，不单独落库
- 每次首页加载或主动刷新时重新生成

### ReviewStatusSummary（复习状态摘要，嵌入）

| 字段           | 类型   | 必填 | 约束                                            | 说明                   |
| -------------- | ------ | ---- | ----------------------------------------------- | ---------------------- |
| statusKind     | String | 是   | `PENDING` / `EMPTY` / `OVERDUE` / `UNAVAILABLE` | 首页主状态             |
| pendingCount   | Number | 是   | `>= 0`                                          | 待复习任务数           |
| overdueCount   | Number | 是   | `>= 0`                                          | 逾期任务数             |
| completedToday | Number | 是   | `>= 0`                                          | 今日已完成数量         |
| todayTarget    | Number | 否   | `>= completedToday`                             | 今日目标数量           |
| lastUpdatedAt  | Date   | 否   | -                                               | 状态源数据最后更新时间 |

**状态转换**:

- `UNAVAILABLE` → `EMPTY` / `PENDING` / `OVERDUE`：首页数据成功加载后确定
- `PENDING` → `OVERDUE`：存在逾期任务时切换为更高优先级状态
- `PENDING` / `OVERDUE` → `EMPTY`：待复习任务清空后切换为空态

### PrimaryActionEntry（关键操作入口，嵌入）

| 字段           | 类型    | 必填 | 约束                                   | 说明                            |
| -------------- | ------- | ---- | -------------------------------------- | ------------------------------- |
| key            | String  | 是   | 唯一；如 `createTopic` / `startReview` | 入口标识                        |
| label          | String  | 是   | 非空                                   | 页面展示名称                    |
| targetModule   | String  | 是   | 非空                                   | 目标模块标识，如 `topic.create` |
| enabled        | Boolean | 是   | -                                      | 是否可立即执行                  |
| priority       | Number  | 是   | `>= 1`                                 | 展示优先级，数字越小优先级越高  |
| disabledReason | String  | 否   | `enabled=false` 时必填                 | 不可用原因说明                  |

**验证规则**:

- 首页返回中必须至少包含 `createTopic` 与 `startReview` 两个入口
- 同一个 `HomeDashboard` 内 `key` 不可重复

### HomeGuidanceSuggestion（首页引导建议，嵌入）

| 字段               | 类型   | 必填 | 约束                                                               | 说明                 |
| ------------------ | ------ | ---- | ------------------------------------------------------------------ | -------------------- |
| type               | String | 是   | `CREATE_FIRST` / `REVIEW_NOW` / `KEEP_MOMENTUM` / `CHECK_PROGRESS` | 建议类型             |
| title              | String | 是   | 非空                                                               | 建议标题             |
| description        | String | 是   | 非空                                                               | 建议说明             |
| suggestedActionKey | String | 是   | 必须引用 `PrimaryActionEntry.key`                                  | 推荐用户执行的入口   |
| reason             | String | 是   | 非空                                                               | 触发该建议的业务原因 |

### HomeActionEvent（首页行为事件，持久化）

| 字段         | 类型     | 必填 | 索引     | 说明                                             |
| ------------ | -------- | ---- | -------- | ------------------------------------------------ |
| \_id         | ObjectId | 自动 | 主键     | MongoDB 自动生成                                 |
| userId       | ObjectId | 是   | 普通索引 | 事件所属用户                                     |
| actionKey    | String   | 是   | 普通索引 | 触发的首页动作，如 `createTopic` / `startReview` |
| targetModule | String   | 是   | -        | 动作目标模块标识                                 |
| guidanceType | String   | 否   | -        | 若由首页建议触发，记录对应建议类型               |
| result       | String   | 是   | -        | `success` / `blocked` / `failed`                 |
| deviceInfo   | String   | 否   | -        | 客户端设备信息                                   |
| createdAt    | Date     | 自动 | 复合索引 | 事件时间                                         |

**关系**:

- 一个 `User` 可对应多个 `HomeActionEvent`
- `HomeDashboard` 依赖 `User`、复习任务聚合结果和知识点统计生成

## Relationship Summary

```text
User (1) ←——→ (N) HomeActionEvent
User / ReviewTask / Topic aggregate ——→ HomeDashboard (derived read model)
HomeDashboard (1) ——contains——→ (1) ReviewStatusSummary
HomeDashboard (1) ——contains——→ (N) PrimaryActionEntry
HomeDashboard (1) ——contains——→ (1) HomeGuidanceSuggestion
```

## Validation Notes

- 所有数量字段必须为非负整数
- `suggestedActionKey` 必须引用本次响应中存在的入口 key
- 当 `statusKind = EMPTY` 时，`startReview` 入口应返回 `enabled = false` 与明确 `disabledReason`
- 当 `statusKind = UNAVAILABLE` 时，关键入口仍必须返回，且前端允许使用最近一次成功快照做显示兜底
