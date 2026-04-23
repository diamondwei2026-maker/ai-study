import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    hookTimeout: 120000,
    testTimeout: 120000,
    globals: true,
  },
});
