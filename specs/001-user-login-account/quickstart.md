# Quickstart: 用户登录与账号管理模块

## 概述

本模块实现 APP 的用户注册、登录、登录状态管理、个人中心和数据隔离功能。

## 跨模块导航约定

- 个人中心、首页、复习列表统一复用 `client/src/components/shared/navigation/AppTabBar.vue`
- 页面右下角的知识点录入入口统一复用 `client/src/components/shared/navigation/KnowledgeEntryFab.vue`
- 知识点录入页源码目录与页面路由统一命名为 `topic-entry`；`create-topic` 仅保留为设计稿资源名
- 若 002、003、004 尚未全部落地，可先用占位页验证导航 wiring 与激活态

## 技术栈

- **前端**: unibest (uni-app) + Vue 3 Composition API + TypeScript + Pinia + wot-design-uni
- **后端**: Node.js + Express + MongoDB (Mongoose) + JWT
- **样式**: UnoCSS

## 快速开始

### 后端

```bash
cd server
npm install mongoose jsonwebtoken bcryptjs express-validator multer
npm run dev
```

需配置环境变量（`.env`）:

```
MONGODB_URI=mongodb://localhost:27017/ai-study
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=30d
```

### 前端

```bash
cd client
# unibest 项目初始化（如尚未创建）
npm install
npm run dev
```

## 核心流程

1. **注册**: 发送验证码 → 输入验证码 → 创建账号 → 自动登录
2. **登录**: 输入手机号 → 验证码/密码 → 获取 Token → 进入主界面
3. **Token 刷新**: Access Token 过期 → 自动用 Refresh Token 换新 → 无感续期
4. **退出**: 清除本地 Token → 删除服务端 Refresh Token → 跳转登录页

## 关键文件

### 后端

```
server/src/
├── models/          # Mongoose 模型（User, VerificationCode, RefreshToken, SecurityLog）
├── routes/          # 路由（auth.ts, user.ts）
├── services/        # 业务逻辑（authService, userService, smsService）
├── middlewares/     # 中间件（auth 校验, 错误处理, 参数校验）
└── utils/           # 工具函数（响应封装, Token 生成）
```

### 前端

```
client/src/
├── pages/login/     # 登录/注册页面
├── pages/mine/      # 个人中心页面
├── components/shared/navigation/  # 全局底部导航与知识点录入悬浮按钮
├── stores/          # Pinia 状态管理（useUserStore）
├── composables/     # 组合式函数（useAuth, useProfile）
└── utils/           # 请求封装（自动附加 Token, 自动刷新）
```
