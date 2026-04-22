# ai-study Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-22

## Active Technologies
- TypeScript（strict mode）, Node.js, Vue 3 `<script setup lang="ts">` + Express 5, cors, dotenv（现有后端）；Mongoose, express-validator, jsonwebtoken, bcryptjs（沿用 001 基础设施）；unibest, Pinia, wot-design-uni, UnoCSS, UnoCSS Icons（前端，按宪章初始化） (002-home-page)
- MongoDB（用户/复习/行为事件数据）；客户端本地存储用于登录态与首页最近一次成功快照 (002-home-page)
- TypeScript（strict mode）, Node.js, Vue 3 `<script setup lang="ts">` + Express 5, cors, dotenv, `@langchain/openrouter`, `@langchain/core`（现有后端）；Mongoose, express-validator, jsonwebtoken, bcryptjs, pino（本特性与 001 基础设施补齐）；unibest, Pinia, wot-design-uni, UnoCSS, UnoCSS Icons（前端，按宪章初始化） (003-knowledge-entry)
- MongoDB（`User`、`KnowledgePoint`、`SharedStandardAnswer`、`ReviewNode`）；客户端本地存储仅沿用登录态，不新增业务离线库 (003-knowledge-entry)
- TypeScript（strict mode）, Node.js, Vue 3 `<script setup lang="ts">` + Express 5, cors, dotenv, `@langchain/openrouter`, `@langchain/core`（现有后端）；Mongoose, express-validator, jsonwebtoken, bcryptjs, pino（本特性与 001/003 基础设施补齐）；unibest, Pinia, wot-design-uni, UnoCSS, UnoCSS Icons（前端，按宪章初始化）；uni-app 本地通知能力（前端提醒调度） (004-review-flow)
- MongoDB（`User`、`KnowledgePoint`、`SharedStandardAnswer`、`ReviewNode`、`ReviewAttempt`）；客户端本地存储用于登录态、提醒调度元数据和费曼输入草稿 (004-review-flow)

- TypeScript (strict mode), Node.js + Express 5, Mongoose, jsonwebtoken, bcryptjs, express-validator, multer (后端); unibest, Vue 3, Pinia, wot-design-uni, UnoCSS (前端) (001-user-login-account)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript (strict mode), Node.js: Follow standard conventions

## Recent Changes
- 004-review-flow: Added TypeScript（strict mode）, Node.js, Vue 3 `<script setup lang="ts">` + Express 5, cors, dotenv, `@langchain/openrouter`, `@langchain/core`（现有后端）；Mongoose, express-validator, jsonwebtoken, bcryptjs, pino（本特性与 001/003 基础设施补齐）；unibest, Pinia, wot-design-uni, UnoCSS, UnoCSS Icons（前端，按宪章初始化）；uni-app 本地通知能力（前端提醒调度）
- 003-knowledge-entry: Added TypeScript（strict mode）, Node.js, Vue 3 `<script setup lang="ts">` + Express 5, cors, dotenv, `@langchain/openrouter`, `@langchain/core`（现有后端）；Mongoose, express-validator, jsonwebtoken, bcryptjs, pino（本特性与 001 基础设施补齐）；unibest, Pinia, wot-design-uni, UnoCSS, UnoCSS Icons（前端，按宪章初始化）
- 002-home-page: Added TypeScript（strict mode）, Node.js, Vue 3 `<script setup lang="ts">` + Express 5, cors, dotenv（现有后端）；Mongoose, express-validator, jsonwebtoken, bcryptjs（沿用 001 基础设施）；unibest, Pinia, wot-design-uni, UnoCSS, UnoCSS Icons（前端，按宪章初始化）


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
