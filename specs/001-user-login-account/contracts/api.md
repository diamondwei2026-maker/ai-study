# API Contracts: 用户登录与账号管理模块

**Base URL**: `/api`  
**统一响应格式**（遵循宪章要求）:

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

**错误码约定**:

- `200` 成功
- `400` 请求参数错误
- `401` 未认证 / Token 无效
- `403` 账号已锁定
- `404` 资源不存在
- `429` 请求频率过高（验证码发送限制）

---

## 认证相关

### POST /api/auth/send-code

发送验证码

**Request Body**:

```json
{
  "phone": "13800138000",
  "type": "register" | "login" | "resetPassword" | "changePhone"
}
```

**Response (200)**:

```json
{
  "code": 200,
  "message": "验证码已发送",
  "data": null
}
```

**Error (429)**: 60 秒内重复发送

---

### POST /api/auth/register

手机号注册

**Request Body**:

```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

**Response (200)**:

```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "664a...",
      "phone": "138****8000",
      "nickname": "用户8000",
      "avatar": null
    }
  }
}
```

---

### POST /api/auth/login

登录（验证码或密码）

**Request Body**:

```json
{
  "phone": "13800138000",
  "code": "123456",
  "password": null
}
```

> `code` 和 `password` 二选一

**Response (200)**: 同注册响应格式

**Error (403)**: 账号已锁定，返回 `lockedUntil` 时间

---

### POST /api/auth/refresh

刷新 Access Token

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200)**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### POST /api/auth/logout

退出登录

**Headers**: `Authorization: Bearer <accessToken>`

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200)**:

```json
{
  "code": 200,
  "message": "已退出登录",
  "data": null
}
```

---

## 密码管理

### POST /api/auth/password/set

设置密码（首次）

**Headers**: `Authorization: Bearer <accessToken>`

**Request Body**:

```json
{
  "password": "newPassword123"
}
```

---

### POST /api/auth/password/change

修改密码

**Headers**: `Authorization: Bearer <accessToken>`

**Request Body**:

```json
{
  "oldPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

---

### POST /api/auth/password/reset

重置密码（忘记密码）

**Request Body**:

```json
{
  "phone": "13800138000",
  "code": "123456",
  "newPassword": "newPassword123"
}
```

---

## 用户资料

### GET /api/user/profile

获取个人资料

**Headers**: `Authorization: Bearer <accessToken>`

**Response (200)**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "664a...",
    "phone": "138****8000",
    "nickname": "用户8000",
    "avatar": "/uploads/avatars/664a....jpg",
    "createdAt": "2026-04-20T10:00:00.000Z"
  }
}
```

---

### PUT /api/user/profile

更新个人资料

**Headers**: `Authorization: Bearer <accessToken>`

**Request Body**:

```json
{
  "nickname": "新昵称"
}
```

---

### POST /api/user/avatar

上传头像

**Headers**: `Authorization: Bearer <accessToken>`  
**Content-Type**: `multipart/form-data`

**Form Data**: `avatar` - 图片文件（JPG/PNG, max 5MB）

**Response (200)**:

```json
{
  "code": 200,
  "message": "头像上传成功",
  "data": {
    "avatar": "/uploads/avatars/664a....jpg"
  }
}
```

---

### POST /api/user/change-phone

修改绑定手机号

**Headers**: `Authorization: Bearer <accessToken>`

**Request Body**:

```json
{
  "oldPhone": "13800138000",
  "oldCode": "123456",
  "newPhone": "13900139000",
  "newCode": "654321"
}
```
