# API Contracts: 首页模块

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

- 本模块接口均要求 `Authorization: Bearer <accessToken>`
- 响应格式必须遵循 `{ code, message, data }`

**错误码约定**:

- `200` 成功
- `400` 请求参数错误
- `401` 未认证 / Token 无效
- `404` 资源不存在

---

## GET /api/home/dashboard

获取首页聚合读模型。

**Response (200)**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "generatedAt": "2026-04-21T09:00:00.000Z",
    "reviewStatus": {
      "statusKind": "OVERDUE",
      "pendingCount": 12,
      "overdueCount": 3,
      "completedToday": 5,
      "todayTarget": 10,
      "lastUpdatedAt": "2026-04-21T08:58:00.000Z"
    },
    "primaryActions": [
      {
        "key": "startReview",
        "label": "开始复习",
        "targetModule": "review.start",
        "enabled": true,
        "priority": 1,
        "disabledReason": null
      },
      {
        "key": "createTopic",
        "label": "新建知识点",
        "targetModule": "topic.create",
        "enabled": true,
        "priority": 2,
        "disabledReason": null
      }
    ],
    "guidance": {
      "type": "REVIEW_NOW",
      "title": "优先清理逾期复习",
      "description": "你有 3 个逾期任务，建议先开始复习。",
      "suggestedActionKey": "startReview",
      "reason": "存在逾期任务"
    }
  }
}
```

**Contract Rules**:

- `primaryActions` 必须始终包含 `createTopic` 与 `startReview`
- 当没有可执行复习任务时，`startReview.enabled` 为 `false`，并提供 `disabledReason`
- 当数据暂不可用时，`reviewStatus.statusKind` 可为 `UNAVAILABLE`，但 `primaryActions` 仍必须存在

---

## POST /api/home/action-events

记录首页关键入口行为，用于后续评估入口使用率与转化率。

**Request Body**:

```json
{
  "actionKey": "startReview",
  "targetModule": "review.start",
  "guidanceType": "REVIEW_NOW",
  "result": "success",
  "deviceInfo": "iPhone15,3 / iOS 18.0"
}
```

**Field Rules**:

- `actionKey`: `createTopic` / `startReview` / `guidanceAction`
- `result`: `success` / `blocked` / `failed`
- `guidanceType` 可为空；当行为来自首页建议时应填写

**Response (200)**:

```json
{
  "code": 200,
  "message": "event recorded",
  "data": null
}
```

**Error (400)**:

```json
{
  "code": 400,
  "message": "invalid action payload",
  "data": null
}
```
