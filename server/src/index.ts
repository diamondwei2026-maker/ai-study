import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ChatOpenRouter } from "@langchain/openrouter";
import { HumanMessage } from "@langchain/core/messages";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量,dotenv默认只会找【当前命令运行目录】下的.env,所以这里要强制去父文件夹找
dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// ====================== OpenRouter 初始化 ======================
const llm = new ChatOpenRouter({
  model: process.env.OPENROUTER_MODEL!,
  apiKey: process.env.OPENROUTER_API_KEY!,
  temperature: 0.7,
});

// ====================== 启动服务 & 控制台自检 ======================
app.listen(PORT, async () => {
  console.log(`\n✅ 服务启动成功：http://localhost:${PORT}`);
  // 自动测试 AI 是否连通
  try {
    const test = await llm.invoke([new HumanMessage("hi")]);
    console.log("✅ OpenRouter 大模型接入成功！首次响应：", test.content);
  } catch (err) {
    console.error("❌ OpenRouter 接入失败：", (err as Error).message);
  }
});
