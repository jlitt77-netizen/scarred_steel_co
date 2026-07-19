// Combined post-retrofit verification: boots `next start` as a CHILD process
// (so it stays alive for the whole run), runs the RBAC/auth flow assertions over
// HTTP, and captures screenshots of the major retrofitted screens.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import { chromium } from "playwright-core";

const BASE = "http://localhost:3100";
const SECRET_STR = "dev-only-insecure-secret-change-in-production-0123456789abcdef";
const SECRET = new TextEncoder().encode(SECRET_STR);
const OUT = "/home/user/scarred_steel_co/docs/screenshots";
mkdirSync(OUT, { recursive: true });

const env = { ...process.env, DATABASE_URL: "file:./dev.db", SESSION_SECRET: SECRET_STR, PORT: "3100" };
const server = spawn("node", ["node_modules/next/dist/bin/next", "start", "-p", "3100"], {
  cwd: "/home/user/scarred_steel_co", env, stdio: "ignore",
});

const prisma = new PrismaClient();
let failures = 0;
const check = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) failures++;
};

async function tokenFor(email) {
  const u = await prisma.user.findUnique({ where: { email } });
  return new SignJWT({ userId: u.id, email: u.email, isInternal: u.isInternal })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt()
    .setIssuer("scarred-steel-platform").setAudience("scarred-steel-session")
    .setExpirationTime("1h").sign(SECRET);
}
const get = (path, cookie) =>
  fetch(BASE + path, { redirect: "manual", headers: cookie ? { cookie: `ss_session=${cookie}` } : {} });

async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE + "/login"); if (r.ok) return true; } catch {}
    await sleep(1000);
  }
  throw new Error("server never became ready");
}

async function main() {
  await waitReady();
  const ceo = await tokenFor("ceo@scarredsteel.co");
  const media = await tokenFor("media@scarredsteel.co");
  const customer = await tokenFor("customer@example.com");

  // ---- Flow assertions (regression) ----
  let r = await get("/os/vehicles");
  check("anon /os/vehicles → /login", r.status === 307 && (r.headers.get("location") || "").includes("/login"));
  r = await get("/os/vehicles", ceo);
  check("CEO loads /os/vehicles (200)", r.status === 200);
  check("CEO sees seeded F-150", (await r.text()).includes("F-150"));
  r = await get("/os", customer);
  check("external blocked from /os → /portal", (r.headers.get("location") || "").includes("/portal"));
  r = await get("/portal", customer);
  check("external loads /portal (200)", r.status === 200);
  r = await get("/os/finance", media);
  check("media denied /os/finance (redirect)", r.status === 307);
  r = await get("/os/media", media);
  check("media loads /os/media (200)", r.status === 200);
  r = await get("/os/ceo", media);
  check("media denied CEO dashboard (redirect)", r.status === 307);

  // ---- Screenshots ----
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const shot = async (name, path, cookie, width = 1440) => {
    const ctx = await browser.newContext({
      viewport: { width, height: 900 },
      ...(cookie ? { storageState: { cookies: [{ name: "ss_session", value: cookie, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }], origins: [] } } : {}),
    });
    const page = await ctx.newPage();
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await sleep(400);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    await ctx.close();
    console.log("shot", name);
  };

  await shot("01-login", "/login", null);
  await shot("02-ceo-dashboard", "/os", ceo);
  await shot("03-vehicles-table", "/os/vehicles", ceo);
  await shot("04-vehicles-gallery", "/os/vehicles?view=gallery", ceo);
  const v = await prisma.vehicle.findFirst({ where: { model: "F-150" } });
  await shot("05-vehicle-detail", `/os/vehicles/${v.id}`, ceo);
  await shot("06-calendar-placeholder", "/os/calendar", ceo);
  await shot("07-finance-placeholder", "/os/finance", ceo);
  await shot("08-audit", "/os/audit", ceo);
  await shot("09-users", "/os/users", ceo);
  await shot("10-portal-home", "/portal", customer);
  await shot("11-mobile-ceo", "/os", ceo, 390);

  await browser.close();
  await prisma.$disconnect();
  console.log(failures === 0 ? "\nALL FLOW CHECKS PASSED" : `\n${failures} FLOW CHECK(S) FAILED`);
}

main()
  .catch((e) => { console.error(e); failures++; })
  .finally(() => { server.kill("SIGTERM"); process.exit(failures === 0 ? 0 : 1); });
