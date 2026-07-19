import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// DB-backed integration tests (tests/services.test.ts) run only when a disposable
// Postgres URL is provided via TEST_DATABASE_URL; the pure unit tests always run.
// This keeps the suite green without a local Postgres while the app targets
// Supabase in dev/prod.
const TEST_DB = process.env.TEST_DATABASE_URL;

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
    fileParallelism: false,
    globalSetup: TEST_DB ? ["./tests/global-setup.ts"] : [],
    hookTimeout: 60000,
    testTimeout: 30000,
    env: {
      DATABASE_URL: TEST_DB || "postgresql://user:pass@localhost:5432/unused",
      DIRECT_URL: TEST_DB || "postgresql://user:pass@localhost:5432/unused",
      TEST_DATABASE_URL: TEST_DB || "",
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
