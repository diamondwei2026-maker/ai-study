# Tasks: 用户登录与账号管理模块

**Input**: Design documents from `specs/001-user-login-account/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅
**UI 设计稿**: client/UI/login.png, client/UI/mine.png

**Organization**: 任务按用户故事分组，每个故事可独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无未完成依赖）
- **[Story]**: 所属用户故事（US1~US6）
- 描述中包含精确文件路径

---

## Phase 1: Setup（项目基础配置）

**Purpose**: 后端依赖安装、环境配置、前端 unibest 项目初始化

- [ ] T001 安装后端依赖：mongoose jsonwebtoken bcryptjs express-validator multer @types/\* 至 server/package.json
- [ ] T002 [P] 在 server/ 根目录创建 .env.example 并定义 MONGODB_URI、JWT_SECRET、JWT_EXPIRES_IN、JWT_REFRESH_EXPIRES_IN、SMS_MOCK 等环境变量
- [ ] T003 [P] 创建 unibest 前端项目至 client/ 目录（Vue 3 + TypeScript + UnoCSS + wot-design-uni + Pinia）
- [ ] T004 在 server/src/index.ts 中增加 MongoDB 连接逻辑（mongoose.connect）并保留现有 Express 结构

**Checkpoint**: 后端可启动并连接 MongoDB，前端 unibest 项目可运行

---

## Phase 2: Foundational（基础设施 — 阻塞所有用户故事）

**Purpose**: 所有用户故事依赖的核心基础设施

**⚠️ CRITICAL**: 所有用户故事均须等待本阶段完成后才能开始

- [ ] T005 [P] 创建统一响应封装工具 server/src/utils/response.ts（success / fail / error 三种格式，遵循 { code, message, data } 结构）
- [ ] T006 [P] 创建 JWT 工具 server/src/utils/token.ts（generateAccessToken / generateRefreshToken / verifyToken）
- [ ] T007 创建 User Mongoose Schema 和 Model server/src/models/User.ts（包含 phone、nickname、avatar、password、status、loginFailCount、lockedUntil 字段）
- [ ] T008 [P] 创建 VerificationCode Mongoose Schema 和 Model server/src/models/VerificationCode.ts（包含 phone、code、type、used、expiresAt TTL 索引）
- [ ] T009 [P] 创建 RefreshToken Mongoose Schema 和 Model server/src/models/RefreshToken.ts（包含 userId、token 唯一索引、deviceInfo、expiresAt TTL 索引）
- [ ] T010 [P] 创建 SecurityLog Mongoose Schema 和 Model server/src/models/SecurityLog.ts（包含 userId、action、result、ip、deviceInfo、detail、createdAt 索引）
- [ ] T011 实现 JWT 校验中间件 server/src/middlewares/auth.ts（从 Authorization header 提取并验证 Access Token，注入 req.userId）
- [ ] T012 [P] 实现参数校验中间件 server/src/middlewares/validate.ts（基于 express-validator 的统一错误收集）
- [ ] T013 [P] 实现全局错误处理中间件 server/src/middlewares/errorHandler.ts（统一捕获并返回标准错误响应）
- [ ] T014 创建模拟短信服务 server/src/services/smsService.ts（定义 ISmsService 接口，MockSmsService 实现：内存存储验证码，开发环境直接返回验证码）
- [ ] T015 在 server/src/index.ts 中注册 errorHandler 中间件和静态文件服务（multer 上传目录 /uploads/avatars）
- [ ] T016 [P] 创建前端请求封装 client/src/utils/request.ts（基于 uni.request 封装，自动注入 Authorization 头，自动调用刷新 Token，401 时跳转登录页）
- [ ] T017 [P] 创建前端 Pinia 用户状态 store client/src/stores/user.ts（存储 accessToken、refreshToken、userInfo，持久化至 uni.setStorageSync）

**Checkpoint**: 基础设施就绪，各用户故事可并行开始

---

## Phase 3: User Story 1 — 用户注册新账号（Priority: P1）🎯 MVP

**Goal**: 新用户通过手机号+验证码完成注册并自动登录进入主界面

**Independent Test**: 全新用户从打开 APP → 输入手机号 → 获取验证码 → 提交注册 → 进入主界面的完整流程

### 后端实现

- [ ] T018 [US1] 实现发送验证码业务逻辑 server/src/services/authService.ts（sendCode：校验手机号格式、60 秒频率限制、生成 6 位验证码、调用 smsService 发送并存入 VerificationCode）
- [ ] T019 [US1] 实现注册业务逻辑 server/src/services/authService.ts（register：校验验证码有效性、检查手机号唯一性、创建 User 文档、生成 JWT 双 Token、存入 RefreshToken、写入 SecurityLog）
- [ ] T020 [US1] 创建认证路由文件 server/src/routes/auth.ts 并注册 POST /api/auth/send-code 和 POST /api/auth/register 端点（含 express-validator 参数校验规则）
- [ ] T021 [US1] 在 server/src/index.ts 中挂载 auth 路由 `/api/auth`

### 前端实现（像素级还原 login.png）

- [ ] T022 [US1] 创建登录/注册页面 client/src/pages/login/index.vue，实现以下设计稿像素级还原：
  - 页面背景色 `#FFFFFF`，安全区域顶部适配
  - 顶部 Logo 图片（居中，宽 120rpx，距顶 120rpx）
  - 主标题文字「欢迎登录」（字号 48rpx，字重 600，颜色 `#1A1A1A`，居中，距 Logo 32rpx）
  - 副标题文字（字号 28rpx，颜色 `#999999`，居中，距主标题 16rpx）
  - 输入区卡片（白色背景，圆角 24rpx，水平边距 32rpx，阴影 `0 8rpx 32rpx rgba(0,0,0,0.08)`，内边距 48rpx 40rpx）
  - 手机号输入框（高度 96rpx，底部边框 `#EEEEEE 2rpx`，字号 32rpx，placeholder 颜色 `#CCCCCC`）
  - 切换 Tab「验证码登录 / 密码登录」（字号 28rpx，选中色 `#3B7BF8`，未选中色 `#999999`，下划线宽度等于文字宽度，切换动画 200ms）
  - 验证码输入框 + 「获取验证码」按钮（按钮宽 200rpx，高 72rpx，圆角 36rpx，边框 `#3B7BF8`，字色 `#3B7BF8`，倒计时状态变灰）
  - 密码输入框（type=password，右侧显示/隐藏眼睛图标）
  - 主操作按钮「登录 / 注册」（高度 96rpx，圆角 48rpx，背景渐变 `linear-gradient(135deg, #3B7BF8, #6B4EFF)`，字色白色，字号 34rpx，字重 600，距输入区 48rpx）
  - 底部协议文字（字号 24rpx，颜色 `#999999`，链接色 `#3B7BF8`）
- [ ] T023 [US1] 实现登录/注册页的交互逻辑 composable client/src/composables/useAuth.ts（sendCode：倒计时 60s；register：调用 API → 写入 store → 跳转主界面；表单校验：手机号正则、验证码 6 位数字、密码 8 位含数字字母）
- [ ] T024 [US1] 在 client/src/pages/login/index.vue 中引入并调用 useAuth composable，绑定表单数据和事件

**Checkpoint**: 可完整走通新用户注册流程，登录页 UI 与设计稿像素级一致

---

## Phase 4: User Story 2 — 用户登录已有账号（Priority: P1）

**Goal**: 已注册用户通过验证码或密码登录，恢复使用状态

**Independent Test**: 已有账号用户从登录页输入凭据到成功进入主界面

### 后端实现

- [ ] T025 [US2] 实现登录业务逻辑 server/src/services/authService.ts（login：支持 code/password 二选一；密码登录校验 loginFailCount >= 5 锁定逻辑；验证码登录可解除锁定；生成双 Token；写 SecurityLog）
- [ ] T026 [US2] 在 server/src/routes/auth.ts 中注册 POST /api/auth/login 端点（含参数校验：phone 必填，code 与 password 至少一个）

### 前端实现

- [ ] T027 [US2] 在 client/src/composables/useAuth.ts 中实现 login 函数（调用 POST /api/auth/login → 写入 store → 跳转主界面；处理 403 锁定提示含剩余解锁时间；处理网络异常）
- [ ] T028 [US2] 在登录页 client/src/pages/login/index.vue 中切换注册/登录模式（Tab 文字、按钮文字、表单字段按设计稿对应切换，切换时清空已填内容）

**Checkpoint**: 验证码登录和密码登录均可正常工作，账号锁定提示正确显示

---

## Phase 5: User Story 3 — 登录状态保持与校验（Priority: P1）

**Goal**: 用户登录后自动续期，重开 APP 无需重新登录

**Independent Test**: 登录后关闭 APP 再重新打开，2 秒内自动恢复登录态进入主界面

### 后端实现

- [ ] T029 [US3] 在 server/src/routes/auth.ts 中注册 POST /api/auth/refresh 端点（authService.refreshToken：验证 RefreshToken 有效性和数据库记录，生成新 Access Token）
- [ ] T030 [US3] 在 server/src/routes/auth.ts 中注册 POST /api/auth/logout 端点（authService.logout：从数据库删除 RefreshToken 记录，写 SecurityLog）

### 前端实现

- [ ] T031 [US3] 在 client/src/utils/request.ts 中完善 Token 自动刷新逻辑（Access Token 过期 → 调用 /api/auth/refresh → 重放原请求；Refresh Token 失效 → 清除 store → 跳转登录页；并发请求队列处理避免重复刷新）
- [ ] T032 [US3] 在 client/src/app.vue 或 pages.json 路由守卫中实现启动时登录态检测（读取 store → 验证 accessToken 有效期 → 失效则调用 refresh → 成功进主界面，失败跳登录页）

**Checkpoint**: 自动续期无感刷新正常工作，Token 过期正确跳转登录页

---

## Phase 6: User Story 4 — 个人中心信息管理（Priority: P2）

**Goal**: 用户查看和修改个人资料（昵称、头像、手机号）

**Independent Test**: 已登录用户进入个人中心修改昵称和头像，修改结果持久化并同步显示

### 后端实现

- [ ] T033 [P] [US4] 创建用户资料路由文件 server/src/routes/user.ts，注册：GET /api/user/profile、PUT /api/user/profile、POST /api/user/avatar（含 multer 中间件，限制 jpg/png，5MB）
- [ ] T034 [US4] 实现用户资料业务逻辑 server/src/services/userService.ts（getProfile：返回脱敏手机号；updateProfile：更新 nickname；uploadAvatar：保存文件路径至 User.avatar；均需校验 userId 一致性，保障数据隔离）

### 前端实现（像素级还原 mine.png）

- [ ] T035 [US4] 创建个人中心页面 client/src/pages/mine/index.vue，实现以下设计稿像素级还原：
  - 状态栏背景色与页面顶部渐变一致（`#3B7BF8` → `#6B4EFF`，高度覆盖状态栏 + 200rpx）
  - 用户信息区：头像圆形（直径 128rpx，白色 4rpx 边框，默认头像 icon），昵称（字号 36rpx，字重 600，颜色白色），手机号脱敏展示（字号 26rpx，颜色 `rgba(255,255,255,0.8)`）
  - 功能列表白色卡片（圆角 24rpx，水平边距 24rpx，距顶部信息区 -40rpx 上浮，阴影 `0 4rpx 24rpx rgba(0,0,0,0.10)`）
  - 每个 cell（高度 112rpx，左侧彩色圆形 icon 背景直径 72rpx，icon 字号 40rpx，标题字号 32rpx 颜色 `#1A1A1A`，右侧副文本 `#999999` + 箭头图标 `#CCCCCC`，底部分割线除最后一项）
  - 功能项列表：「编辑昵称」「更换头像」「修改密码」「换绑手机号」
  - 底部「退出登录」按钮（高度 96rpx，圆角 48rpx，背景 `#FFF5F5`，字色 `#FF4D4F`，字号 32rpx，字重 500，水平边距 32rpx，距列表 48rpx）
  - 页面底部安全区域适配 `padding-bottom: env(safe-area-inset-bottom)`
- [ ] T036 [US4] 实现个人中心数据逻辑 composable client/src/composables/useProfile.ts（fetchProfile：获取并填充用户信息；updateNickname：调用 PUT /api/user/profile → 更新 store；uploadAvatar：uni.chooseImage → 上传 multipart/form-data → 更新 store；同步更新 Pinia store）
- [ ] T037 [US4] 在 client/src/pages/mine/index.vue 中引入 useProfile，绑定数据并接入头像点击上传、昵称点击弹窗编辑交互

**Checkpoint**: 个人中心 UI 与设计稿像素级一致，资料修改后全局同步

---

## Phase 7: User Story 5 — 密码管理与账号安全（Priority: P2）

**Goal**: 用户可设置/修改/重置密码，并可退出登录

**Independent Test**: 用户执行忘记密码 → 验证码 → 设置新密码 → 新密码登录的完整流程

### 后端实现

- [ ] T038 [P] [US5] 在 server/src/routes/auth.ts 中注册以下端点：
  - POST /api/auth/password/set（需 auth 中间件，authService.setPassword：首次设置密码，bcrypt 加密存储）
  - POST /api/auth/password/change（需 auth 中间件，authService.changePassword：验证旧密码，更新新密码，写 SecurityLog）
  - POST /api/auth/password/reset（无需登录，authService.resetPassword：验证手机号验证码，重置密码，写 SecurityLog）

### 前端实现

- [ ] T039 [US5] 创建密码设置/修改/重置页面 client/src/pages/mine/password.vue（布局参考个人中心卡片风格：白色卡片，圆角输入框，主色渐变确认按钮；三种模式通过 route query 区分）
- [ ] T040 [US5] 在 client/src/composables/useAuth.ts 中实现 setPassword / changePassword / resetPassword 函数（表单校验：密码 8 位含字母数字；调用对应 API；成功提示；修改密码成功后执行 logout 流程）
- [ ] T041 [US5] 在 client/src/pages/mine/index.vue 中为「修改密码」cell 添加导航，绑定退出登录按钮（调用 useAuth.logout → 清除 store → 跳转登录页，显示确认弹窗）

**Checkpoint**: 密码设置/修改/重置/退出登录全流程正常运行

---

## Phase 8: User Story 6 — 用户数据隔离（Priority: P2）

**Goal**: 所有 API 严格按 userId 隔离数据，任何用户无法访问他人数据

**Independent Test**: 用两个不同账号分别调用资料接口，验证各自只能访问自己的数据

### 后端实现

- [ ] T042 [US6] 审查并加固 server/src/routes/user.ts 所有端点：确保每个需要认证的接口均使用 auth 中间件，且 userService 方法均以 req.userId 作为查询条件
- [ ] T043 [US6] 审查 server/src/services/userService.ts：确保 getProfile / updateProfile / uploadAvatar 均通过 `{ _id: userId }` 过滤，不接受客户端传入的 userId 参数
- [ ] T044 [US6] 在 server/src/middlewares/auth.ts 中加固：Token 解析失败返回标准 401 响应（使用 response.ts 封装），不泄露具体错误原因

**Checkpoint**: 数据隔离零违规，所有用户只能操作自己的数据

---

## Phase 9: User Story 追加 — 换绑手机号（Priority: P2）

**Goal**: 用户在个人中心换绑新手机号（需验证原号码和新号码）

**Independent Test**: 用户完成换绑后，下次登录使用新手机号

### 后端实现

- [ ] T045 [US4] 在 server/src/routes/user.ts 中注册 POST /api/user/change-phone 端点（需 auth 中间件，userService.changePhone：验证原手机验证码、验证新手机验证码、更新 User.phone、写 SecurityLog）

### 前端实现

- [ ] T046 [US4] 创建换绑手机号页面 client/src/pages/mine/change-phone.vue（两步流程：步骤1验证原手机号 + 步骤2绑定新手机号；进度条显示当前步骤；样式参考登录页卡片风格）
- [ ] T047 [US4] 在 client/src/pages/mine/index.vue 中为「换绑手机号」cell 添加导航

**Checkpoint**: 换绑手机号完整流程正常，store 中手机号更新

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: 体验优化、错误兜底、可访问性、性能

- [ ] T048 [P] 在前端所有页面添加网络异常提示（uni.showToast），request.ts 中统一捕获网络错误并展示友好提示
- [ ] T049 [P] 验证 UnoCSS 配置中自定义颜色 token（`brand-primary: #3B7BF8`，`brand-secondary: #6B4EFF`，`danger: #FF4D4F`）已在 client/uno.config.ts 中注册，替换所有硬编码色值
- [ ] T050 [P] 在 server/src/index.ts 中添加静态文件服务以提供 /uploads/avatars 目录的头像访问
- [ ] T051 [P] 登录页按钮添加防抖（300ms），避免重复提交；获取验证码按钮倒计时期间禁用并显示剩余秒数（格式：`60s 后重新获取`）
- [ ] T052 [P] 个人中心页下拉刷新实现（uni-app `onPullDownRefresh`，刷新后重新调用 fetchProfile）
- [ ] T053 为 server/ 添加基础 README，说明启动命令、环境变量和 API 端点列表

---

## Dependencies（用户故事完成顺序）

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation)
    ↓
Phase 3 (US1: 注册) ← MVP，可独立交付
    ↓
Phase 4 (US2: 登录) ← 依赖 US1 的认证服务
    ↓
Phase 5 (US3: 状态保持) ← 依赖 US1+US2 的 Token 体系
    ↓
Phase 6 (US4: 个人中心) ← 依赖 US1~3 的登录态
Phase 7 (US5: 密码管理) ← 依赖 US1~3，可与 US4 并行
Phase 8 (US6: 数据隔离) ← 贯穿所有用户故事
Phase 9 (换绑手机) ← 依赖 US4 个人中心框架
    ↓
Phase 10 (Polish) ← 所有故事完成后
```

## Parallel Execution（并行执行机会）

每个阶段内标记 `[P]` 的任务可并行执行：

- **Phase 2**: T005, T006, T008, T009, T010, T012, T013, T014, T016, T017 可并行（不同文件）
- **Phase 6 & 7**: 个人中心后端（T033, T034）与密码管理后端（T038）可并行
- **Phase 10**: T048, T049, T050, T051, T052 全部可并行

## Implementation Strategy

**MVP Scope（最小可交付版本）**: Phase 1 + 2 + 3（注册 + 基础登录页 UI）

- 完成后即可演示：新用户注册 → 登录页像素级 UI → 验证码注册流程

**Increment 2**: + Phase 4 + 5（登录 + 状态保持）
**Increment 3**: + Phase 6 + 7（个人中心像素级 UI + 密码管理）
**Full Delivery**: Phase 1~10 全部完成

---

## UI 实现规范（来自设计稿分析）

### 登录页（client/UI/login.png）关键规格

| 元素           | 规格                                                           |
| -------------- | -------------------------------------------------------------- |
| 页面背景       | `#FFFFFF`                                                      |
| 主色调         | `#3B7BF8`（品牌蓝）                                            |
| 渐变色         | `linear-gradient(135deg, #3B7BF8 0%, #6B4EFF 100%)`            |
| 输入框高度     | 96rpx，底部分割线 `#EEEEEE`                                    |
| 卡片圆角       | 24rpx，阴影 `0 8rpx 32rpx rgba(0,0,0,0.08)`                    |
| 主按钮         | 高 96rpx，圆角 48rpx，渐变背景，白色字体，字号 34rpx           |
| Tab 切换指示线 | 宽度随文字，高 4rpx，圆角 2rpx，颜色 `#3B7BF8`，切换动画 200ms |
| 验证码按钮     | 宽 200rpx，高 72rpx，圆角 36rpx，边框色 `#3B7BF8`              |

### 个人中心页（client/UI/mine.png）关键规格

| 元素           | 规格                                                                                   |
| -------------- | -------------------------------------------------------------------------------------- |
| 顶部渐变区     | `#3B7BF8` → `#6B4EFF`，覆盖状态栏 + 约 200rpx                                          |
| 头像           | 直径 128rpx，白色 4rpx border，圆形                                                    |
| 昵称字体       | 36rpx，字重 600，颜色 `#FFFFFF`                                                        |
| 手机号字体     | 26rpx，颜色 `rgba(255,255,255,0.8)`                                                    |
| 功能卡片       | 白色，圆角 24rpx，margin 水平 24rpx，上浮 -40rpx，阴影 `0 4rpx 24rpx rgba(0,0,0,0.10)` |
| Cell 高度      | 112rpx                                                                                 |
| Cell icon 背景 | 圆形直径 72rpx，各功能项使用对应主题色                                                 |
| 退出按钮       | 高 96rpx，圆角 48rpx，背景 `#FFF5F5`，字色 `#FF4D4F`                                   |
