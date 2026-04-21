# Research: 用户登录与账号管理模块

**Feature**: 001-user-login-account  
**Date**: 2026-04-20

## R-001: JWT Token 认证方案

**Decision**: 使用 JWT (JSON Web Token) 作为登录状态管理方案，配合 Refresh Token 实现长期登录

**Rationale**:

- 无状态认证，适合前后端分离架构
- Express 生态有成熟的 `jsonwebtoken` 库
- 配合 Refresh Token 可实现 30 天自动续期
- 与宪章要求的 RESTful API 架构高度匹配

**Alternatives considered**:

- Session-Cookie 方案：需服务端存储 session，不适合移动端 APP
- OAuth2.0：过于复杂，首期仅手机号登录，无需第三方认证

**实现要点**:

- Access Token 有效期 2 小时
- Refresh Token 有效期 30 天，存储于 MongoDB
- Token 中仅包含 userId，不存储敏感信息
- 通过 Express 中间件统一校验 Token

## R-002: 密码加密方案

**Decision**: 使用 bcrypt 对密码进行哈希加密存储

**Rationale**:

- 宪章明确要求"密码 MUST 使用 bcrypt 或等效算法加密存储"
- bcrypt 自带盐值生成，防止彩虹表攻击
- Node.js 生态的 `bcryptjs` 库纯 JS 实现，无需编译原生依赖

**Alternatives considered**:

- argon2：安全性更高但需编译原生模块，增加部署复杂度
- scrypt：Node.js 内置但 API 不如 bcrypt 简洁

## R-003: 短信验证码服务

**Decision**: 定义统一的短信服务接口（`ISmsService`），首期使用内存模拟实现，后续对接实际短信服务商

**Rationale**:

- 短信服务商选型属于运维决策，不影响业务逻辑
- 通过接口抽象可随时切换供应商
- 开发和测试阶段使用模拟实现，避免短信费用

**实现要点**:

- 验证码 6 位数字，有效期 5 分钟
- 同一手机号 60 秒内仅允许发送一次
- 验证成功后立即失效（一次性使用）

## R-004: MongoDB 数据模型设计

**Decision**: 使用 Mongoose ODM 定义 Schema，遵循宪章要求

**Rationale**:

- 宪章要求"所有集合 MUST 通过 Mongoose Schema 定义"
- 宪章要求"所有数据库 CRUD MUST 通过 Mongoose Model 方法执行"

**实现要点**:

- User Schema：包含手机号（唯一索引）、昵称、头像、密码（可选）、状态
- VerificationCode Schema：包含手机号、验证码、类型、过期时间
- SecurityLog Schema：包含用户ID、操作类型、IP、设备信息、时间

## R-005: 数据隔离策略

**Decision**: 通过 JWT 中间件提取 userId，所有数据查询自动附加 userId 过滤条件

**Rationale**:

- 最简单有效的租户隔离方式
- 在中间件层统一处理，避免每个接口单独实现
- MongoDB 索引可高效过滤 userId

**Alternatives considered**:

- 数据库级别隔离（每用户一个数据库）：过度设计
- Collection 级别隔离：管理复杂度高

## R-006: 账号锁定策略

**Decision**: 在 User 文档中记录连续失败次数和锁定截止时间

**Rationale**:

- 简单直接，无需额外集合
- 登录成功后重置失败计数
- 锁定时间 30 分钟，超时自动解锁

## R-007: 头像上传方案

**Decision**: 使用本地文件存储，通过 Express 静态文件服务提供访问

**Rationale**:

- 首期用户量有限，本地存储足够
- 后续可替换为云存储（OSS/S3）
- 限制 5MB、仅 JPG/PNG 格式

**Alternatives considered**:

- 云存储（阿里云 OSS）：增加外部依赖，首期不必要
- Base64 存入数据库：浪费存储空间，影响查询性能
