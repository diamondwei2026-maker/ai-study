# API Contracts: 知识点录入模块

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
- `409` 当前用户已存在相同或语义相近知识点
- `502` 标准答案生成失败

---

## POST /api/topics

创建用户知识点，并同步完成标准答案解析/生成与初始复习计划初始化。

**Request Body**:

```json
{
  "title": "牛顿第二定律"
}
```

**Field Rules**:

- `title` 去除首尾空白后长度必须为 1-30 字
- `title` 只能包含纯文字内容，不允许链接、图片、富文本或 Markdown 痕迹
- 客户端仅提交单条标题，不支持批量创建
- 重复判定先以 normalizedTitle 精确匹配，其中 normalizedTitle 指标题去除首尾空白、压缩连续空格并统一常见全角/半角符号后的结果
- 若共享答案命中或生成流程解析出 canonicalTitle，则再以 canonicalTitle 对当前用户既有知识点做精确匹配
- 若未解析出 canonicalTitle，则仅依据 normalizedTitle 是否命中决定是否返回 `409`

**Response (200)**:

```json
{
  "code": 200,
  "message": "知识点创建成功",
  "data": {
    "knowledgePoint": {
      "id": "6650c3b8a9a0d4d8e0f2a001",
      "title": "牛顿第二定律",
      "canonicalTitle": "牛顿第二定律",
      "createdAt": "2026-04-22T10:00:00.000Z",
      "firstReviewAt": "2026-04-22T11:00:00.000Z"
    },
    "standardAnswer": {
      "id": "6650c3b8a9a0d4d8e0f2b001",
      "canonicalTitle": "牛顿第二定律",
      "content": "物体所受合外力等于质量乘以加速度。",
      "source": "reused"
    },
    "reviewPlan": {
      "totalNodes": 6,
      "nextDueAt": "2026-04-22T11:00:00.000Z",
      "nodes": [
        {
          "sequence": 1,
          "label": "1小时后",
          "dueAt": "2026-04-22T11:00:00.000Z"
        },
        {
          "sequence": 2,
          "label": "第1天",
          "dueAt": "2026-04-23T10:00:00.000Z"
        },
        {
          "sequence": 3,
          "label": "第3天",
          "dueAt": "2026-04-25T10:00:00.000Z"
        },
        {
          "sequence": 4,
          "label": "第7天",
          "dueAt": "2026-04-29T10:00:00.000Z"
        },
        {
          "sequence": 5,
          "label": "第15天",
          "dueAt": "2026-05-07T10:00:00.000Z"
        },
        {
          "sequence": 6,
          "label": "第30天",
          "dueAt": "2026-05-22T10:00:00.000Z"
        }
      ]
    }
  }
}
```

**Contract Rules**:

- 仅当 `knowledgePoint` 与 6 个 `reviewPlan.nodes` 全部创建成功时才返回 `200`
- `standardAnswer.source` 只能为 `reused` 或 `generated`
- `reviewPlan.totalNodes` 必须恒等于 `6`
- `reviewPlan.nextDueAt` 必须等于 `sequence = 1` 的 `dueAt`

**Error (409)**:

```json
{
  "code": 409,
  "message": "已存在相同或相近知识点",
  "data": {
    "existingKnowledgePoint": {
      "id": "6650c3b8a9a0d4d8e0f2a999",
      "title": "牛顿第二定律",
      "canonicalTitle": "牛顿第二定律",
      "firstReviewAt": "2026-04-22T11:00:00.000Z"
    }
  }
}
```

**Error (400)**:

```json
{
  "code": 400,
  "message": "标题需为 1-30 字纯文字内容",
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

**Error (502)**:

```json
{
  "code": 502,
  "message": "标准答案生成失败，请稍后重试",
  "data": null
}
```
