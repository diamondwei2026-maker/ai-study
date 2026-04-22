# Data Model: 知识点录入模块

**Feature**: 003-knowledge-entry  
**Date**: 2026-04-22

## Entities

### KnowledgePoint（用户知识点，持久化）

| 字段            | 类型     | 必填 | 索引         | 说明                                            |
| --------------- | -------- | ---- | ------------ | ----------------------------------------------- |
| \_id            | ObjectId | 自动 | 主键         | MongoDB 自动生成                                |
| userId          | ObjectId | 是   | 复合唯一索引 | 关联当前用户                                    |
| title           | String   | 是   | -            | 用户原始输入标题，去首尾空白后保存              |
| normalizedTitle | String   | 是   | 普通索引     | 标题规范化结果，用于首轮精确去重                |
| canonicalTitle  | String   | 是   | 复合唯一索引 | AI/共享知识库确认后的规范化主题名，用于语义去重 |
| sharedAnswerId  | ObjectId | 是   | 普通索引     | 关联 `SharedStandardAnswer`                     |
| source          | String   | 是   | -            | 固定为 `manualEntry`，标识录入来源              |
| firstReviewAt   | Date     | 是   | 普通索引     | 第一个复习节点的到期时间                        |
| createdAt       | Date     | 自动 | -            | 创建时间                                        |
| updatedAt       | Date     | 自动 | -            | 更新时间                                        |

**验证规则**:

- `title` 去除首尾空白后长度必须在 1-30 之间
- `title` 不允许包含链接、富文本标记、图片占位或其他非纯文字内容
- `(userId, canonicalTitle)` 必须唯一，防止当前用户录入语义相近的重复知识点

### SharedStandardAnswer（共享标准答案，持久化）

| 字段                     | 类型     | 必填 | 索引     | 说明                                     |
| ------------------------ | -------- | ---- | -------- | ---------------------------------------- |
| \_id                     | ObjectId | 自动 | 主键     | MongoDB 自动生成                         |
| canonicalTitle           | String   | 是   | 唯一索引 | 全局共享知识点的规范化标题               |
| normalizedCanonicalTitle | String   | 是   | 普通索引 | 规范化标题的可检索版本                   |
| aliases                  | String[] | 是   | 多键索引 | 共享知识库维护的别名/近义标题列表        |
| answerContent            | String   | 是   | -        | 该知识点的标准答案正文                   |
| answerSource             | String   | 是   | -        | `reused` / `generated`，标记本次落库来源 |
| answerVersion            | Number   | 是   | -        | 当前答案版本号，默认从 1 开始            |
| createdAt                | Date     | 自动 | -        | 创建时间                                 |
| updatedAt                | Date     | 自动 | -        | 更新时间                                 |

**验证规则**:

- `canonicalTitle` 必须全局唯一
- `aliases` 至少包含 `canonicalTitle` 的一种可检索形式
- `answerContent` 必须为非空纯文本内容，供多用户复用

### ReviewNode（初始复习节点，持久化）

| 字段             | 类型     | 必填 | 索引         | 说明                                                             |
| ---------------- | -------- | ---- | ------------ | ---------------------------------------------------------------- |
| \_id             | ObjectId | 自动 | 主键         | MongoDB 自动生成                                                 |
| userId           | ObjectId | 是   | 复合索引     | 关联当前用户                                                     |
| knowledgePointId | ObjectId | 是   | 复合索引     | 关联 `KnowledgePoint`                                            |
| sequence         | Number   | 是   | 复合唯一索引 | 固定为 1-6，表示节点顺序                                         |
| offsetCode       | String   | 是   | -            | `H1` / `D1` / `D3` / `D7` / `D15` / `D30`                        |
| offsetMinutes    | Number   | 是   | -            | 60 / 1440 / 4320 / 10080 / 21600 / 43200                         |
| dueAt            | Date     | 是   | 普通索引     | 节点到期时间                                                     |
| status           | String   | 是   | 普通索引     | 初始值为 `pending`，后续复习模块可推进为 `completed` / `overdue` |
| createdAt        | Date     | 自动 | -            | 创建时间                                                         |
| updatedAt        | Date     | 自动 | -            | 更新时间                                                         |

**验证规则**:

- 每个 `KnowledgePoint` 必须恰好生成 6 条初始 `ReviewNode`
- `(knowledgePointId, sequence)` 必须唯一
- `dueAt` 必须严格按 `KnowledgePoint.createdAt + offsetMinutes` 计算，且 6 个节点时间递增

## Relationship Summary

```text
User (1) ←——→ (N) KnowledgePoint
SharedStandardAnswer (1) ←——→ (N) KnowledgePoint
KnowledgePoint (1) ←——→ (6) ReviewNode
User (1) ←——→ (N) ReviewNode
```

## Derived Rules

- 当用户提交标题时，系统先根据 `normalizedTitle` 和 `aliases` 命中共享知识库，再确定 `canonicalTitle`
- 只有在 `KnowledgePoint` 和 6 条 `ReviewNode` 同时创建成功时，接口才返回成功结果
- `firstReviewAt` 必须等于 `sequence = 1` 的 `ReviewNode.dueAt`
- 共享答案更新不应影响既有 `KnowledgePoint` 的所有权和用户复习节点，但可供后续新建流程复用
