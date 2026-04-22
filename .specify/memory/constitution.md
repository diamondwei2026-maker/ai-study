<!--
  Sync Impact Report
  ==================================================
  Version change: 1.0.0 → 1.1.0
  Modified principles:
    - Additional Constraints（前端文件命名规则按 unibest 路由约定澄清）
  Added sections:
    - N/A
  Removed sections:
    - N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ compatible
    - .specify/templates/spec-template.md ✅ compatible
    - .specify/templates/tasks-template.md ✅ compatible
  Follow-up TODOs: None
  ==================================================
-->

# AI-Study 项目宪章 (Constitution)

## Core Principles

### I. 前端技术栈锁定（NON-NEGOTIABLE）

本项目前端技术栈 **强制锁定**，任何 AI 生成内容与人工开发内容
MUST 严格遵守以下选型，不可变更、不可替代：

- **框架**: unibest（基于 uni-app 的最佳实践模板）
- **样式方案**: UnoCSS（原子化 CSS），禁止引入 Tailwind、
  WindiCSS 或任何其他 CSS 框架
- **图标方案**: UnoCSS Icons，禁止使用 iconfont、SVG sprite
  或其他图标方案
- **组件库**: wot-design-uni，禁止引入 Element Plus、Vant、
  uView 或任何其他组件库
- **脚本范式**: Vue 3 组合式 API（`<script setup lang="ts">`），
  禁止使用 Options API
- **类型系统**: TypeScript 严格模式（`strict: true`）
- **构建工具**: Vite，禁止使用 Webpack、Rollup 等替代方案
- **状态管理**: Pinia，禁止使用 Vuex 或其他状态管理库

**违规判定**：引入上述锁定范围之外的框架、组件库或样式方案，
一律驳回，不予合并。

### II. 后端技术栈锁定（NON-NEGOTIABLE）

本项目后端技术栈 **强制锁定**，任何 AI 生成内容与人工开发内容
MUST 严格遵守以下选型，不可变更：

- **运行时**: Node.js + Express 框架
- **数据库**: MongoDB（通过 Mongoose ODM 操作）
- **接口规范**: RESTful API，统一路由前缀 `/api`
- **请求/响应格式**: 统一 JSON 格式封装，包含 `code`、
  `message`、`data` 三个标准字段
- 禁止私自变更后端技术选型（如替换为 Koa、Fastify、NestJS、
  PostgreSQL、MySQL 等）

**违规判定**：引入上述锁定范围之外的后端框架或数据库，
一律驳回，不予合并。

### III. 前端代码纪律（NON-NEGOTIABLE）

所有前端代码 MUST 满足以下约束，无例外：

- **禁止硬编码色值/阴影**：所有颜色、阴影 MUST 通过
  UnoCSS 预设或 CSS 变量引用，禁止在代码中出现
  `#xxx`、`rgb()`、`rgba()`、`box-shadow` 等硬编码值
- **组件复用**: 所有 UI 组件 MUST 优先使用 wot-design-uni
  提供的组件；仅当组件库无法满足需求时，方可自定义组件，
  且 MUST 遵循 UnoCSS 样式方案
- **图标统一**: 所有图标 MUST 使用 UnoCSS Icons 方案，
  格式为 `<view class="i-icon-name" />`
- **逻辑拆分**: 页面组件中的业务逻辑 MUST 拆分至
  `composables/` 或 `utils/` 目录，页面组件仅负责
  模板渲染与事件绑定
- **零错误门禁**: 提交前 MUST 确保零 TypeScript 编译错误、
  零 ESLint 错误；存在任何错误的代码禁止提交

### IV. 后端代码纪律与安全（NON-NEGOTIABLE）

所有后端代码 MUST 满足以下约束，无例外：

- **接口统一封装**: 所有 API 路由 MUST 使用统一的响应
  封装函数返回结果，禁止在路由处理函数中直接
  `res.json()` 自定义格式
- **请求参数校验**: 所有接口 MUST 对入参进行校验
  （使用 Joi、express-validator 或等效方案），
  禁止信任未校验的用户输入
- **敏感信息加密存储**: 密码 MUST 使用 bcrypt 或等效
  算法加密存储；Token、密钥等敏感配置 MUST 通过
  环境变量注入，禁止硬编码在源码中
- **MongoDB 数据模型规范**: 所有集合 MUST 通过 Mongoose
  Schema 定义，包含字段类型、必填标记、索引声明；
  禁止使用动态/松散 Schema
- **禁止裸写数据库操作**: 所有数据库 CRUD MUST 通过
  Mongoose Model 方法执行，禁止使用原生 MongoDB Driver
  直接操作或拼接查询语句

### V. 工程治理与发布纪律

所有参与者（含 AI 代理）MUST 遵守以下工程规范：

- **语义化提交**: 所有 Git 提交信息 MUST 遵循
  Conventional Commits 规范（`feat:`、`fix:`、`docs:`、
  `chore:` 等），禁止无意义提交信息
- **主干保护**: `main` / `master` 分支受保护，禁止直接
  推送；所有变更 MUST 通过 Pull Request 合并
- **全量门禁校验**: 上线前 MUST 通过以下全部检查：
  - TypeScript 编译零错误
  - ESLint 零错误
  - 单元测试全部通过（如有）
  - 构建成功（`vite build` / `tsc`）
- **宪章最高权威**: 本宪章为项目最高技术规范，
  任何代码、文档、配置变更与宪章冲突时，
  以宪章为准，违规内容一律驳回

## Additional Constraints

### 前端附加约束

- 路由配置 MUST 遵循 unibest 约定式路由规范
- 网络请求 MUST 通过统一的 `request` 封装模块发起，
  禁止直接调用 `uni.request` 或 `fetch`
- 页面源码目录 MUST 遵循 unibest 路由约定，
  使用 `client/src/pages/<route>/index.vue` 结构，目录名与
  路由片段保持 kebab-case 一致
- 组件文件命名 MUST 使用 PascalCase，
  composables/utils 文件命名 MUST 使用 camelCase
- 环境变量 MUST 通过 `.env.*` 文件管理，
  禁止在代码中硬编码环境相关值

### 后端附加约束

- 路由文件 MUST 按业务模块拆分至 `routes/` 目录
- 业务逻辑 MUST 拆分至 `services/` 层，
  路由层仅负责参数提取与调用 service
- 错误处理 MUST 使用统一的错误中间件捕获，
  禁止在每个路由中单独 try-catch 后返回自定义错误格式
- 日志 MUST 使用结构化日志方案（如 winston / pino），
  禁止使用 `console.log` 作为生产日志手段
- CORS、Rate Limiting 等安全中间件 MUST 在应用初始化时
  统一配置

## Development Workflow & Quality Gates

### 分支策略

- `main`：生产分支，受保护，仅通过 PR 合并
- `dev`：开发集成分支，日常开发合并目标
- `001-xxx`：功能分支，采用 Speckit 顺序编号 + 语义 slug 命名，从 `dev` 检出，完成后合并回 `dev`
- `fix/xxx`：修复分支，从 `main` 或 `dev` 检出

### 提交规范

所有提交 MUST 遵循以下格式：

```
<type>(<scope>): <subject>
```

- `type`：feat / fix / docs / style / refactor / test / chore
- `scope`：client / server / shared / config
- `subject`：简短描述，不超过 72 字符

### 质量门禁（上线前必过）

| 门禁项          | 前端              | 后端           |
| --------------- | ----------------- | -------------- |
| TypeScript 编译 | 零错误            | 零错误         |
| ESLint 检查     | 零错误            | 零错误         |
| 构建验证        | `vite build` 成功 | `tsc` 成功     |
| 安全扫描        | 无已知高危依赖    | 无已知高危依赖 |

### 代码审查要求

- 所有 PR MUST 附带变更说明
- 审查者 MUST 验证变更是否符合本宪章
- 涉及技术选型变更的 PR MUST 经宪章修订流程批准后方可合并

## Governance

- **宪章至上**: 本宪章为 AI-Study 项目的最高技术规范文件，
  优先级高于任何其他实践、约定或个人偏好
- **修订流程**: 宪章修订 MUST 提交专项 PR，标题以
  `docs(constitution):` 开头，经项目负责人审批后合并
- **版本管理**: 宪章版本遵循语义化版本号（SemVer）：
  - MAJOR：原则删除或不兼容的治理变更
  - MINOR：新增原则或实质性扩展
  - PATCH：措辞澄清、拼写修正
- **合规审查**: 所有 PR / Code Review MUST 验证是否符合
  本宪章；任何违反宪章的变更 MUST 被驳回并要求修正
- **AI 代理约束**: 所有 AI 生成代码 MUST 无条件遵守
  本宪章全部条款，不得以 "AI 限制" 为由绕过任何规则

**Version**: 1.1.0 | **Ratified**: 2026-04-20 | **Last Amended**: 2026-04-22
