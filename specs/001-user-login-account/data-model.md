# Data Model: 用户登录与账号管理模块

**Feature**: 001-user-login-account  
**Date**: 2026-04-20

## Entities

### User（用户）

| 字段           | 类型     | 必填 | 索引     | 说明                                |
| -------------- | -------- | ---- | -------- | ----------------------------------- |
| \_id           | ObjectId | 自动 | 主键     | MongoDB 自动生成                    |
| phone          | String   | 是   | 唯一索引 | 手机号，格式校验                    |
| nickname       | String   | 否   | -        | 昵称，默认"用户+手机号后4位"        |
| avatar         | String   | 否   | -        | 头像文件路径                        |
| password       | String   | 否   | -        | bcrypt 加密后的密码哈希，初始可为空 |
| status         | String   | 是   | -        | 账号状态：active / locked           |
| loginFailCount | Number   | 是   | -        | 连续登录失败次数，默认 0            |
| lockedUntil    | Date     | 否   | -        | 账号锁定截止时间                    |
| createdAt      | Date     | 自动 | -        | 注册时间（Mongoose timestamps）     |
| updatedAt      | Date     | 自动 | -        | 更新时间（Mongoose timestamps）     |

**状态转换**:

- `active` → `locked`：连续密码错误 >= 5 次
- `locked` → `active`：锁定时间超过 30 分钟，或手机验证码登录成功

### VerificationCode（验证码）

| 字段      | 类型     | 必填 | 索引     | 说明                                                 |
| --------- | -------- | ---- | -------- | ---------------------------------------------------- |
| \_id      | ObjectId | 自动 | 主键     | -                                                    |
| phone     | String   | 是   | 普通索引 | 目标手机号                                           |
| code      | String   | 是   | -        | 6 位数字验证码                                       |
| type      | String   | 是   | -        | 用途：register / login / resetPassword / changePhone |
| used      | Boolean  | 是   | -        | 是否已使用，默认 false                               |
| expiresAt | Date     | 是   | TTL 索引 | 过期时间（创建后 5 分钟），MongoDB TTL 自动清理      |
| createdAt | Date     | 自动 | -        | 创建时间                                             |

**验证规则**:

- 同一手机号同一类型，60 秒内不可重复发送
- 验证成功后标记 `used = true`
- 过期后由 MongoDB TTL 索引自动删除

### RefreshToken（刷新令牌）

| 字段       | 类型     | 必填 | 索引     | 说明              |
| ---------- | -------- | ---- | -------- | ----------------- |
| \_id       | ObjectId | 自动 | 主键     | -                 |
| userId     | ObjectId | 是   | 普通索引 | 关联用户          |
| token      | String   | 是   | 唯一索引 | Refresh Token 值  |
| deviceInfo | String   | 否   | -        | 设备信息          |
| expiresAt  | Date     | 是   | TTL 索引 | 过期时间（30 天） |
| createdAt  | Date     | 自动 | -        | 创建时间          |

**关系**: 一个用户可有多个 RefreshToken（多设备登录）

### SecurityLog（安全日志）

| 字段       | 类型     | 必填 | 索引     | 说明                                                                    |
| ---------- | -------- | ---- | -------- | ----------------------------------------------------------------------- |
| \_id       | ObjectId | 自动 | 主键     | -                                                                       |
| userId     | ObjectId | 否   | 普通索引 | 关联用户（登录失败时可能无 userId）                                     |
| action     | String   | 是   | -        | 操作类型：login / logout / passwordChange / passwordReset / phoneChange |
| result     | String   | 是   | -        | 操作结果：success / failure                                             |
| ip         | String   | 否   | -        | 客户端 IP                                                               |
| deviceInfo | String   | 否   | -        | 设备信息                                                                |
| detail     | String   | 否   | -        | 补充说明                                                                |
| createdAt  | Date     | 自动 | 普通索引 | 操作时间                                                                |

## Entity Relationships

```
User (1) ←——→ (N) RefreshToken
User (1) ←——→ (N) SecurityLog
Phone ←——→ (N) VerificationCode（无直接外键关联，通过 phone 字段查询）
```
