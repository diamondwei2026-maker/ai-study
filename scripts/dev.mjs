import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const serverDir = path.join(rootDir, "server");
const clientDir = path.join(rootDir, "client");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const requireFromServer = createRequire(path.join(serverDir, "package.json"));
const { MongoMemoryReplSet } = requireFromServer("mongodb-memory-server");
const dotenv = requireFromServer("dotenv");

let shuttingDown = false;
const children = [];
let mongoReplSet = null;

function log(label, message) {
  console.log(`[${label}] ${message}`);
}

function logError(label, message) {
  console.error(`[${label}] ${message}`);
}

function attachOutput(child, label) {
  if (child.stdout) {
    const stdout = readline.createInterface({ input: child.stdout });
    stdout.on("line", (line) => log(label, line));
  }

  if (child.stderr) {
    const stderr = readline.createInterface({ input: child.stderr });
    stderr.on("line", (line) => logError(label, line));
  }
}

function spawnDevProcess(label, cwd, env) {
  const child = spawn(npmCommand, ["run", "dev"], {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  children.push(child);
  attachOutput(child, label);

  child.on("error", (error) => {
    if (shuttingDown) {
      return;
    }

    logError(label, `启动失败: ${error.message}`);
    void shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    logError(label, `已退出: ${reason}`);
    void shutdown(code && code !== 0 ? code : 1);
  });

  return child;
}

async function readServerEnvFile() {
  const envPath = path.join(serverDir, ".env");

  try {
    const content = await fs.readFile(envPath, "utf8");
    return dotenv.parse(content);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return {};
    }

    throw error;
  }
}

function resolveValue(key, fileEnv, fallback) {
  return process.env[key] ?? fileEnv[key] ?? fallback;
}

async function stopChild(child) {
  if (!child || child.exitCode !== null || child.killed || !child.pid) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn(
        "taskkill",
        ["/pid", String(child.pid), "/t", "/f"],
        {
          stdio: "ignore",
        },
      );

      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
    });
    return;
  }

  child.kill("SIGTERM");
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  await Promise.all(children.map((child) => stopChild(child)));

  if (mongoReplSet) {
    await mongoReplSet.stop();
    log("mongo", "已停止临时内存 MongoDB");
  }

  process.exit(exitCode);
}

async function startMongo(fileEnv) {
  const configuredMongoUri = resolveValue("MONGODB_URI", fileEnv, "");

  if (configuredMongoUri) {
    log("root", `使用已有 MongoDB: ${configuredMongoUri}`);
    return configuredMongoUri;
  }

  mongoReplSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      name: "rs0",
    },
  });

  const mongoUri = mongoReplSet.getUri("ai-study");
  log("mongo", `已启动临时内存 MongoDB: ${mongoUri}`);
  return mongoUri;
}

async function main() {
  const fileEnv = await readServerEnvFile();
  const mongoUri = await startMongo(fileEnv);
  const serverEnv = {
    ...process.env,
    MONGODB_URI: mongoUri,
    PORT: resolveValue("PORT", fileEnv, "3000"),
    JWT_SECRET: resolveValue("JWT_SECRET", fileEnv, "dev-secret"),
    JWT_EXPIRES_IN: resolveValue("JWT_EXPIRES_IN", fileEnv, "2h"),
    JWT_REFRESH_EXPIRES_IN: resolveValue(
      "JWT_REFRESH_EXPIRES_IN",
      fileEnv,
      "30d",
    ),
    SMS_MOCK: resolveValue("SMS_MOCK", fileEnv, "true"),
    OPENROUTER_MOCK: resolveValue("OPENROUTER_MOCK", fileEnv, "true"),
  };

  log("root", "正在启动 server 和 client 开发服务");
  spawnDevProcess("server", serverDir, serverEnv);
  spawnDevProcess("client", clientDir, process.env);
  log("root", "浏览器入口通常为 http://localhost:5173/");
}

process.on("SIGINT", () => {
  void shutdown(0);
});

process.on("SIGTERM", () => {
  void shutdown(0);
});

main().catch(async (error) => {
  logError(
    "root",
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  await shutdown(1);
});
