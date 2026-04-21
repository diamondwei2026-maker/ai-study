# Quickstart: 首页模块

## 概述

本模块实现 APP 首页作为核心入口的三项能力：复习状态总览、关键操作入口以及跨模块任务引导。

## 前置条件

- 001 用户登录与账号管理基础设施已按设计落地，至少包含认证中间件、统一响应封装与 MongoDB 连接
- 本地可用的 MongoDB 实例
- Node.js 与 npm 环境可用
- `client/UI/home.png` 作为首页视觉稿参考

## 初始化步骤

### 1. 后端准备

```bash
cd server
npm install mongoose express-validator jsonwebtoken bcryptjs
npm run dev
```

推荐环境变量：

```env
MONGODB_URI=mongodb://localhost:27017/ai-study
JWT_SECRET=replace-with-real-secret
PORT=3000
```

### 2. 前端准备

- 在 `client/` 目录按 unibest 官方方式初始化 Vue 3 + TypeScript 工程
- 安装并启用 Pinia、wot-design-uni、UnoCSS、UnoCSS Icons
- 保留 `client/UI/` 设计稿目录，不将源码写入其中
- 配置统一请求封装，禁止直接在页面内调用底层请求 API

### 3. 实施顺序

1. 先补齐 001 认证基础设施的可复用实现
2. 新增首页聚合接口 `GET /api/home/dashboard`
3. 新增首页行为记录接口 `POST /api/home/action-events`
4. 在前端实现首页页面、首页 store 和 `useHome` composable
5. 接入关键入口跳转到知识点新建与复习流程

## 手工验收场景

### 场景 A：有待复习任务

1. 使用已登录且有待复习数据的用户进入首页
2. 验证首页展示待复习数、今日进度、逾期提示
3. 点击“开始复习”，验证能够进入复习模块

### 场景 B：无待复习任务

1. 使用无待复习数据的用户进入首页
2. 验证首页展示空态文案
3. 验证“新建知识点”可正常点击，“开始复习”给出明确反馈而非报错

### 场景 C：弱网或接口失败

1. 模拟首页聚合接口超时或失败
2. 验证首页仍保留关键操作入口
3. 验证页面使用占位或最近一次成功快照做兜底展示

## 关键文件目标

```text
server/src/routes/home.ts
server/src/services/homeService.ts
server/src/models/HomeActionEvent.ts
client/src/pages/home/index.vue
client/src/stores/home.ts
client/src/composables/useHome.ts
```
