# API Contracts: 复习全流程模块

**Base URL**: `/api`  
**统一响应格式**:

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

**认证要求**:

- 本模块接口要求 `Authorization: Bearer <accessToken>`
- 响应格式必须遵循 `{ code, message, data }`

**错误码约定**:

- `200` 成功
- `400` 请求参数错误
- `401` 未认证 / Token 无效
- `404` 复习任务不存在
- `409` 复习任务状态已变化，当前请求不可继续执行
- `502` AI 判定失败

---

## GET /api/reviews/tasks

获取复习列表数据、分组统计、风险摘要与提醒计划元数据。

**Query Parameters**:

- `tab`: `pending` / `overdue` / `all`，默认 `pending`

**Response (200)**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "summary": {
      "pendingCount": 7,
      "overdueCount": 5,
      "allCount": 12,
      "showOverdueAlert": false,
      "pinnedKnowledgePointIds": ["6650c3b8a9a0d4d8e0f2a888"]
    },
    "reminderPolicy": {
      "preDueMinutes": 30,
      "overdueReminderMinutes": [60, 1440],
      "maxOverdueReminders": 2
    },
    "tasks": [
      {
        "taskId": "6650c3b8a9a0d4d8e0f2c001",
        "knowledgePointId": "6650c3b8a9a0d4d8e0f2a001",
        "knowledgePointTitle": "Vue3 响应式原理",
        "status": "overdue",
        "overdueLevel": "short",
        "dueAt": "2026-04-22T08:00:00.000Z",
        "isPinned": true,
        "overdueCountForKnowledgePoint": 3,
        "nextReminderAt": "2026-04-22T09:00:00.000Z",
        "routeTarget": "/pages/review-session/index?taskId=6650c3b8a9a0d4d8e0f2c001"
      }
    ]
  }
}
```

**Contract Rules**:

- `summary.overdueCount > 10` 时，`showOverdueAlert` 必须为 `true`
- `isPinned = true` 的任务必须在同一列表分组中排在非置顶任务之前
- `nextReminderAt` 仅在仍存在未触发提醒时返回

**Error (401)**:

```json
{
  "code": 401,
  "message": "未认证或登录已失效",
  "data": null
}
```

---

## GET /api/reviews/tasks/:taskId

获取单个复习任务的执行详情，用于费曼复习页面或通知跳转落地。

**Response (200)**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "task": {
      "taskId": "6650c3b8a9a0d4d8e0f2c001",
      "knowledgePointId": "6650c3b8a9a0d4d8e0f2a001",
      "knowledgePointTitle": "Vue3 响应式原理",
      "planLabel": "第1次复习 · 录入后1小时",
      "status": "overdue",
      "overdueLevel": "short",
      "dueAt": "2026-04-22T08:00:00.000Z",
      "overdueDescription": "已过期 1 小时。记忆保留率较高，正常进行复习即可。"
    },
    "feynmanPrompt": {
      "title": "费曼输出要求",
      "description": "请用大白话解释该知识点的含义，讲给一个完全不懂的人听。",
      "minRecommendedChars": 80,
      "pureTextOnly": true
    }
  }
}
```

**Error (409)**:

```json
{
  "code": 409,
  "message": "该复习任务状态已变化，请返回列表刷新后重试",
  "data": null
}
```

**Error (404)**:

```json
{
  "code": 404,
  "message": "复习任务不存在或已失效",
  "data": null
}
```

---

## POST /api/reviews/tasks/:taskId/submit

提交费曼输出，完成 AI 判定、计划调整和任务状态更新。

**Request Body**:

```json
{
  "content": "我会这样给别人解释 Vue3 响应式原理：当数据变化时，系统会自动追踪并更新依赖这些数据的视图。"
}
```

**Field Rules**:

- `content` 去除空白后必须非空
- `content` 只能包含纯文字内容，不允许富文本、图片、链接或附件

**Response (200)**:

```json
{
  "code": 200,
  "message": "review completed",
  "data": {
    "attemptId": "6650c3b8a9a0d4d8e0f2d001",
    "result": {
      "judgment": "FUZZY",
      "reason": "你说明了数据变化会驱动视图更新，但没有解释依赖收集和触发更新的基本机制。",
      "planAdjustmentKey": "SHORT_OVERDUE_FUZZY_ROLLBACK_REINFORCE"
    },
    "taskUpdate": {
      "status": "completed",
      "completedAt": "2026-04-22T09:05:00.000Z",
      "nextDueAt": "2026-04-23T09:05:00.000Z"
    },
    "followUpNodes": [
      {
        "nodeType": "reinforcement",
        "dueAt": "2026-04-23T09:05:00.000Z"
      },
      {
        "nodeType": "initial",
        "dueAt": "2026-04-25T09:05:00.000Z"
      }
    ],
    "redirectTarget": "/pages/review/index?tab=pending"
  }
}
```

**Contract Rules**:

- 仅当 AI 判定、当前任务状态更新和后续节点创建全部成功时才返回 `200`
- `result.judgment` 仅允许 `MASTERED` / `FUZZY` / `UNMASTERED`
- `taskUpdate.nextDueAt` 必须等于 `followUpNodes` 中最早的 `dueAt`
- `followUpNodes.nodeType` 仅允许 `reinforcement` / `initial` / `continuation`
- 当当前任务已是最后一个既有计划节点且规则要求继续推进时，`followUpNodes` 中必须包含一个 30 天后的 `continuation` 节点

**Error (400)**:

```json
{
  "code": 400,
  "message": "费曼输出不能为空，且仅支持纯文字内容",
  "data": null
}
```

**Error (401)**:

```json
{
  "code": 401,
  "message": "未认证或登录已失效",
  "data": null
}
```

**Error (404)**:

```json
{
  "code": 404,
  "message": "复习任务不存在或已失效",
  "data": null
}
```

**Error (502)**:

```json
{
  "code": 502,
  "message": "AI 判定失败，请稍后重试",
  "data": {
    "draftRetained": true
  }
}
```
