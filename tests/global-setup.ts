import { execSync } from "node:child_process";

// Build a fresh SQLite schema for the test database before the suite runs.
export default function setup() {
  execSync("npx prisma db push --force-reset --skip-generate", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: "file:./test.db",
    },
  });
}
