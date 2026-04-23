# 用户登录与账号管理模块

## 启动

1. 在仓库根目录准备 `.env`，可参考 [server/.env.example](d:/Users/weij/ai-study/server/.env.example)
2. 安装依赖：`cd server && npm install`
3. 开发启动：`npm run dev`
4. 构建：`npm run build`
5. 测试：`npm run test`

## 环境变量

| 变量                     | 说明                     | 默认建议                             |
| ------------------------ | ------------------------ | ------------------------------------ |
| `PORT`                   | 服务端口                 | `3000`                               |
| `MONGODB_URI`            | MongoDB 连接串           | `mongodb://localhost:27017/ai-study` |
| `JWT_SECRET`             | JWT 签名密钥             | 必填                                 |
| `JWT_EXPIRES_IN`         | Access Token 有效期      | `2h`                                 |
| `JWT_REFRESH_EXPIRES_IN` | Refresh Token 有效期     | `30d`                                |
| `SMS_MOCK`               | 是否使用模拟短信         | `true`                               |
| `OPENROUTER_MODEL`       | 可选，后续 AI 功能模型名 | 空                                   |
| `OPENROUTER_API_KEY`     | 可选，后续 AI 功能密钥   | 空                                   |

## API 端点

### 认证

- `POST /api/auth/send-code`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/password/set`
- `POST /api/auth/password/change`
- `POST /api/auth/password/reset`

### 用户资料

- `GET /api/user/profile`
- `PUT /api/user/profile`
- `POST /api/user/avatar`
- `POST /api/user/change-phone`

## 测试与压测

- 集成测试使用 `vitest + supertest + mongodb-memory-server`
- 压测脚本入口：`npm run load:test`
- 可通过以下环境变量定制压测：
  - `LOAD_TEST_BASE_URL`
  - `LOAD_TEST_CONNECTIONS`
  - `LOAD_TEST_DURATION`
  - `LOAD_TEST_PHONE`
  - `LOAD_TEST_PASSWORD`
  - `LOAD_TEST_REFRESH_TOKEN`
  - `LOAD_TEST_ACCESS_TOKEN`
