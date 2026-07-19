// End-to-end HTTP flow test against a running `next start` server.
// Verifies the product boundary + RBAC at the real HTTP/middleware layer.
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);
const prisma = new PrismaClient();

async function tokenFor(email) {
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) throw new Error(`missing user ${email}`);
  return new SignJWT({ userId: u.id, email: u.email, isInternal: u.isInternal })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("scarred-steel-platform")
    .setAudience("scarred-steel-session")
    .setExpirationTime("1h")
    .sign(SECRET);
}

let failures = 0;
function check(name, cond, detail = "") {
  const ok = !!cond;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!ok) failures++;
}

async function get(path, cookie) {
  return fetch(BASE + path, {
    redirect: "manual",
    headers: cookie ? { cookie: `ss_session=${cookie}` } : {},
  });
}

const main = async () => {
  const ceo = await tokenFor("ceo@scarredsteel.co");
  const media = await tokenFor("media@scarredsteel.co");
  const customer = await tokenFor("customer@example.com");

  // 1. Unauthenticated internal route -> redirect to /login
  let r = await get("/os/vehicles");
  check("anon /os/vehicles redirects to /login", r.status >= 300 && r.status < 400 && (r.headers.get("location") || "").includes("/login"), `status=${r.status}`);

  // 2. CEO can load the live Vehicles module and sees seeded truck
  r = await get("/os/vehicles", ceo);
  const ceoBody = await r.text();
  check("CEO loads /os/vehicles (200)", r.status === 200, `status=${r.status}`);
  check("CEO sees seeded F-150", ceoBody.includes("F-150"));

  // 3. External customer is bounced from CEO OS by middleware
  r = await get("/os", customer);
  check("external user blocked from /os -> /portal", (r.headers.get("location") || "").includes("/portal"), `status=${r.status} loc=${r.headers.get("location")}`);

  r = await get("/os/vehicles", customer);
  check("external user blocked from /os/vehicles", r.status >= 300 && r.status < 400);

  // 4. External customer can reach the portal
  r = await get("/portal", customer);
  check("external user loads /portal (200)", r.status === 200, `status=${r.status}`);

  // 5. Media producer lacks finance:read -> confidential finance page redirects away
  r = await get("/os/finance", media);
  check("media producer denied /os/finance (redirect)", r.status >= 300 && r.status < 400, `status=${r.status}`);

  // 6. Media producer CAN reach its own media module
  r = await get("/os/media", media);
  check("media producer loads /os/media (200)", r.status === 200, `status=${r.status}`);

  await prisma.$disconnect();
  console.log(failures === 0 ? "\nALL FLOW CHECKS PASSED" : `\n${failures} FLOW CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
};

main().catch((e) => { console.error(e); process.exit(1); });
