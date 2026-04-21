# 项目宪章生成 Prompt

## 使用场景

生成前端+后端一体化项目宪章，约束所有 AI 生成内容与人工开发内容。

## Prompt 原文

生成前端+后端一体化项目宪章，所有AI生成内容、人工开发内容必须无条件遵守，核心要求如下：

1. **前端技术栈（强制锁定，不可变更）**：unibest + UnoCSS + UnoCSS Icons + wot-design-uni，Vue3 组合式API（script setup），TypeScript严格模式，Vite构建，Pinia状态管理，禁止混用其他框架/组件库/样式方案。

2. **后端技术栈（强制锁定，不可变更）**：express + MongoDB，统一接口规范，统一请求响应格式，禁止私自变更后端技术选型。

3. **前端附加约束**：禁止硬编码色值/阴影，所有UI组件复用wot-design-uni，图标统一用UnoCSS Icons，脚本逻辑拆分至composables/utils，零TypeScript错误、零ESLint错误。

4. **后端附加约束**：接口统一封装，请求参数校验，敏感信息加密存储，MongoDB数据模型规范，禁止裸写SQL/数据库操作。

5. **整体要求**：遵循语义化提交，主干保护，上线前通过全量门禁校验，宪章为项目最高技术规范，违规一律驳回。

## 使用命令

```
/speckit.constitution
```

## 生成日期

2026-04-20
