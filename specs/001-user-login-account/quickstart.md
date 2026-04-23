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

1. **注册**: 发送验证码 → 输入验证码 → 创建账号 → 自动登录并进入默认落点 `mine`
2. **登录**: 输入手机号 → 验证码/密码 → 获取 Token → 进入默认落点 `mine`
3. **Token 刷新**: Access Token 过期 → 自动用 Refresh Token 换新 → 无感续期
4. **退出**: 清除本地 Token → 删除服务端 Refresh Token → 跳转登录页

## SC-003 / SC-004 验收脚本

### SC-003: 冷启动 / 热启动登录态恢复

- **样本量**: 100 次（冷启动 50 次 + 热启动 50 次）
- **计时起点**:
  - 冷启动：点击应用图标后首屏开始渲染
  - 热启动：应用从后台切回前台时触发 `onShow`
- **计时终点**: 个人中心 `mine` 页首屏数据和导航可交互
- **通过阈值**: 90% 以上样本耗时 <= 2 秒

建议脚本：

```text
1. 预先登录一个测试账号，确保本地存在 accessToken 和 refreshToken
2. 连续执行 50 次完全退出 APP -> 重新打开 -> 记录进入 mine 的耗时
3. 连续执行 50 次切后台 5 秒 -> 回到前台 -> 记录恢复 mine 的耗时
4. 统计 P50 / P90 / 最大值，并计算 <= 2 秒的样本占比
5. 若占比 >= 90%，则 SC-003 通过
```

### SC-004: 资料修改同步

- **样本量**: 20 次（昵称更新 10 次 + 头像更新 10 次）
- **计时起点**:
  - 昵称：点击昵称保存按钮
  - 头像：确认选择图片并提交上传
- **计时终点**: 当前 mine 页和本地 store 都显示新值
- **通过阈值**: 95% 以上样本耗时 <= 3 秒

建议脚本：

```text
1. 登录测试账号并打开 mine 页面
2. 执行 10 次昵称修改，每次记录点击保存到页面与 store 同步完成的耗时
3. 执行 10 次头像修改，每次记录确认上传到页面与 store 同步完成的耗时
4. 统计 20 次样本中 <= 3 秒的占比
5. 若占比 >= 95%，则 SC-004 通过
```

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
