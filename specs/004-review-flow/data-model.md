# Data Model: 复习全流程模块

**Feature**: 004-review-flow  
**Date**: 2026-04-22

## Entities

### ReviewNode（复习节点/任务，持久化，扩展 003）

| 字段                     | 类型     | 必填 | 索引     | 说明                                         |
| ------------------------ | -------- | ---- | -------- | -------------------------------------------- |
| \_id                     | ObjectId | 自动 | 主键     | MongoDB 自动生成                             |
| userId                   | ObjectId | 是   | 复合索引 | 关联当前用户                                 |
| knowledgePointId         | ObjectId | 是   | 复合索引 | 关联 `KnowledgePoint`                        |
| sequence                 | Number   | 是   | 复合索引 | 同一知识点下的执行顺序                       |
| nodeType                 | String   | 是   | -        | `initial` / `reinforcement` / `continuation` |
| sourceNodeId             | ObjectId | 否   | 普通索引 | 若为补强或延展节点，记录触发来源节点         |
| dueAt                    | Date     | 是   | 普通索引 | 本节点应复习时间                             |
| status                   | String   | 是   | 复合索引 | `pending` / `completed` / `overdue`          |
| overdueLevel             | String   | 否   | 普通索引 | `short` / `medium` / `long`，仅过期时存在    |
| overdueAt                | Date     | 否   | -        | 首次进入过期状态的时间                       |
| wasOverdue               | Boolean  | 是   | -        | 本节点是否曾进入过期状态                     |
| overdueReminderSentCount | Number   | 是   | -        | 已发送的过期追加提醒数，范围 0-2             |
| completedAt              | Date     | 否   | 普通索引 | 本节点完成复习时间                           |
| nextDueAt                | Date     | 否   | 普通索引 | 由本节点执行后生成的下一个主要复习时间       |
| createdAt                | Date     | 自动 | -        | 创建时间                                     |
| updatedAt                | Date     | 自动 | -        | 更新时间                                     |

**验证规则**:

- `status = overdue` 时必须存在 `overdueAt`
- `overdueReminderSentCount` 不得超过 2
- `nodeType = reinforcement` 时必须存在 `sourceNodeId`
- 同一 `knowledgePointId` 下 `dueAt` 必须按实际生成顺序可排序

**状态转换**:

- `pending` → `overdue`：`dueAt` 过去且未完成时
- `pending` / `overdue` → `completed`：用户提交有效费曼输出并成功完成结果更新后

### ReviewTaskListItem（复习列表读模型，非持久化）

| 字段                          | 类型     | 必填 | 来源             | 说明                                |
| ----------------------------- | -------- | ---- | ---------------- | ----------------------------------- |
| taskId                        | ObjectId | 是   | `ReviewNode._id` | 当前列表项标识                      |
| knowledgePointTitle           | String   | 是   | `KnowledgePoint` | 知识点标题                          |
| status                        | String   | 是   | 聚合             | `pending` / `completed` / `overdue` |
| overdueLevel                  | String   | 否   | 聚合             | 过期等级                            |
| isPinned                      | Boolean  | 是   | 聚合             | 是否因累计过期达到 3 次而置顶       |
| dueAt                         | Date     | 是   | `ReviewNode`     | 当前任务应复习时间                  |
| nextReminderAt                | Date     | 否   | 计算             | 下一次本地提醒触发时间              |
| overdueCountForKnowledgePoint | Number   | 是   | 聚合             | 该知识点累计过期次数                |

**验证规则**:

- `isPinned = true` 时，`overdueCountForKnowledgePoint` 必须大于等于 3
- 过期列表排序优先级必须满足长期 > 中期 > 短期，再按 `overdueCountForKnowledgePoint` 和 `dueAt`

### ReviewAttempt（复习尝试，持久化）

| 字段                     | 类型       | 必填 | 索引     | 说明                                |
| ------------------------ | ---------- | ---- | -------- | ----------------------------------- |
| \_id                     | ObjectId   | 自动 | 主键     | MongoDB 自动生成                    |
| reviewNodeId             | ObjectId   | 是   | 普通索引 | 关联本次执行的 `ReviewNode`         |
| userId                   | ObjectId   | 是   | 复合索引 | 关联当前用户                        |
| knowledgePointId         | ObjectId   | 是   | 复合索引 | 关联知识点                          |
| submissionText           | String     | 是   | -        | 用户提交的费曼输出正文              |
| submittedAt              | Date       | 是   | 普通索引 | 提交时间                            |
| judgment                 | String     | 是   | 普通索引 | `MASTERED` / `FUZZY` / `UNMASTERED` |
| judgmentReason           | String     | 是   | -        | AI 判定原因说明                     |
| overdueLevelAtSubmission | String     | 否   | -        | 提交时的过期等级快照                |
| adjustmentKey            | String     | 是   | -        | 对应计划调整矩阵的执行键            |
| nextDueAt                | Date       | 是   | 普通索引 | 本次执行后的下一主要复习时间        |
| createdFollowUpNodeIds   | ObjectId[] | 是   | -        | 由本次提交创建的后续节点列表        |
| resultStatus             | String     | 是   | -        | `applied` / `failed`                |
| createdAt                | Date       | 自动 | -        | 创建时间                            |
| updatedAt                | Date       | 自动 | -        | 更新时间                            |

**验证规则**:

- `submissionText` 去除空白后必须非空
- `judgment` 仅允许三种枚举值
- `resultStatus = applied` 时必须存在 `nextDueAt`

### ReviewReminder（提醒元数据，客户端本地持久化）

| 字段               | 类型     | 必填 | 索引     | 说明                                          |
| ------------------ | -------- | ---- | -------- | --------------------------------------------- |
| localReminderId    | String   | 是   | 主键     | 客户端本地提醒记录标识                        |
| reviewNodeId       | ObjectId | 是   | 普通索引 | 关联的 `ReviewNode`                           |
| reminderKind       | String   | 是   | -        | `pre_due` / `overdue_1h` / `overdue_24h`      |
| scheduledFor       | Date     | 是   | 普通索引 | 本次提醒计划触发时间                          |
| notificationStatus | String   | 是   | -        | `scheduled` / `sent` / `canceled` / `skipped` |
| routeTarget        | String   | 是   | -        | 点击后跳转的复习页面路由                      |
| createdAt          | Date     | 是   | -        | 本地写入时间                                  |
| updatedAt          | Date     | 是   | -        | 本地更新时间                                  |

**验证规则**:

- 每个 `ReviewNode` 最多只能存在 3 条提醒元数据
- 当关联任务完成、失效或状态变化后，未触发提醒必须转为 `canceled`

## Relationship Summary

```text
KnowledgePoint (1) ←——→ (N) ReviewNode
ReviewNode (1) ←——→ (N) ReviewAttempt
ReviewNode (1) ←——→ (0..3) ReviewReminder (local)
KnowledgePoint + ReviewNode aggregate ——→ ReviewTaskListItem (derived read model)
```

## Derived Rules

- 单个知识点的累计过期次数由历史 `ReviewNode.wasOverdue = true` 的记录聚合得出
- “短期补强节点”固定为当前完成时间后 24 小时创建的 `reinforcement` 节点
- 当任务推进超出现有最后节点时，新增一个 30 天后的 `continuation` 节点
- `ReviewTaskListItem.nextReminderAt` 由 `dueAt`、过期状态和 `ReviewReminder.notificationStatus` 共同推导
- 只有当 `ReviewAttempt.resultStatus = applied` 时，当前 `ReviewNode` 的状态和后续节点创建才视为生效
