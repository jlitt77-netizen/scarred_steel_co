import { execSync } from "node:child_process";

// Build a fresh schema for the disposable Postgres test database before the
// suite runs. Only invoked when TEST_DATABASE_URL is set (see vitest.config.ts).
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) return;
  execSync("npx prisma db push --force-reset --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
