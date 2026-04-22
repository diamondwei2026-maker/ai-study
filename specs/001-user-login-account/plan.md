# Implementation Plan: 用户登录与账号管理模块

**Branch**: `001-user-login-account` | **Date**: 2026-04-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-user-login-account/spec.md`

## Summary

实现 APP 用户注册、登录（手机号+验证码/密码）、登录状态管理（JWT + Refresh Token）、个人中心（资料编辑、头像上传、换绑手机号）、密码管理及用户数据隔离。后端使用 Express + MongoDB (Mongoose) + JWT，前端使用 unibest + Vue 3 + Pinia；认证成功后的默认落点统一为个人中心 mine 页面，在个人中心交付时同步抽取首页、复习列表与个人中心共用的底部导航和知识点录入悬浮按钮契约，并为未交付导航目标提供占位页或不可用提示。

## Technical Context

**Language/Version**: TypeScript (strict mode), Node.js  
**Primary Dependencies**: Express 5, Mongoose, jsonwebtoken, bcryptjs, express-validator, multer (后端); unibest, Vue 3, Pinia, wot-design-uni, UnoCSS (前端)  
**Storage**: MongoDB (Mongoose ODM)  
**Testing**: Vitest（后端单元/集成测试）+ 认证与资料 API 验证 + 性能压测脚本  
**Target Platform**: 移动端 APP (uni-app 多端) + Node.js API 服务  
**Project Type**: Mobile APP + Web Service  
**Performance Goals**: 登录状态恢复 < 2 秒（90% 启动样本）; 核心认证/资料接口在 10,000 并发会话下错误率 <= 1%，P95 <= 800ms  
**Constraints**: 验证码 60 秒发送限制; 密码连续错误 5 次锁定 30 分钟  
**Scale/Scope**: 10,000+ 用户; 前端约 5 个页面; 后端约 12 个 API 接口

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原则                   | 状态    | 说明                                                                                              |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| I. 前端技术栈锁定      | ✅ PASS | 使用 unibest + Vue 3 Composition API + TypeScript + UnoCSS + wot-design-uni + Pinia               |
| II. 后端技术栈锁定     | ✅ PASS | 使用 Node.js + Express + MongoDB (Mongoose), RESTful API, 统一 JSON 响应                          |
| III. 前端代码纪律      | ✅ PASS | 设计稿视觉规范通过 UnoCSS token / CSS 变量表达，无页面级硬编码色值或阴影，逻辑拆分至 composables/ |
| IV. 后端代码纪律与安全 | ✅ PASS | 统一响应封装, express-validator 校验, bcrypt 加密, Mongoose Schema, 环境变量注入                  |
| V. 工程治理与发布纪律  | ✅ PASS | 语义化提交, 功能分支开发, 零错误门禁                                                              |

**Post-Phase 1 Re-check**: ✅ 全部通过，设计产物符合宪章所有条款。

## Project Structure

### Documentation (this feature)

```text
specs/001-user-login-account/
├── plan.md              # 本文件
├── spec.md              # 功能规格说明
├── research.md          # Phase 0 研究产出
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 快速开始指南
├── contracts/           # Phase 1 接口契约
│   └── api.md           # RESTful API 契约
├── checklists/          # 质量检查清单
│   └── requirements.md
└── tasks.md             # Phase 2 任务清单（由 /speckit.tasks 生成）
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── index.ts              # 应用入口（已有）
│   ├── models/               # Mongoose 数据模型
│   │   ├── User.ts
│   │   ├── VerificationCode.ts
│   │   ├── RefreshToken.ts
│   │   └── SecurityLog.ts
│   ├── routes/               # Express 路由（按模块拆分）
│   │   ├── auth.ts
│   │   └── user.ts
│   ├── services/             # 业务逻辑层
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   └── smsService.ts
│   ├── middlewares/          # 中间件
│   │   ├── auth.ts           # JWT 校验
│   │   ├── errorHandler.ts   # 统一错误处理
│   │   └── validate.ts       # 参数校验
│   └── utils/                # 工具函数
│       ├── response.ts       # 统一响应封装
│       └── token.ts          # JWT 工具
└── tests/
    ├── helpers/
    ├── unit/
    ├── integration/
    └── performance/

client/
├── src/
│   ├── pages/
│   │   ├── login/            # 登录/注册页
│   │   └── mine/             # 个人中心页
│   ├── components/
│   │   └── shared/
│   │       └── navigation/
│   │           ├── AppTabBar.vue
│   │           └── KnowledgeEntryFab.vue
│   ├── stores/               # Pinia 状态管理
│   │   └── user.ts
│   ├── composables/          # 组合式函数
│   │   ├── useAuth.ts
│   │   └── useProfile.ts
│   └── utils/
│       └── request.ts        # 统一请求封装（Token 管理）
```

**Structure Decision**: 采用 client/server 分离结构（已有），符合项目现有布局。后端按 models/routes/services/middlewares/utils 分层，遵循宪章中"路由按模块拆分、业务逻辑拆分至 services 层"的要求；前端在个人中心落地时同步沉淀 `client/src/components/shared/navigation/`，供首页、复习列表和个人中心复用，001 以内登录成功后的默认落点为 `mine` 页面；首页、复习入口在对应模块交付前由共享导航提供占位页或不可用提示；知识点录入目标路由统一命名为 `topic-entry`，对应源码目录 `client/src/pages/topic-entry/index.vue`。

## Complexity Tracking

> 无宪章违规，无需记录。
