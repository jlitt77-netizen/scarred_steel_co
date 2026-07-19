import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
    fileParallelism: false,
    globalSetup: ["./tests/global-setup.ts"],
    hookTimeout: 60000,
    testTimeout: 30000,
    env: {
      DATABASE_URL: "file:./test.db",
      SESSION_SECRET: "test-secret-test-secret-test-secret-0123456789",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
