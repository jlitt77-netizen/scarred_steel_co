import { SignJWT, jwtVerify } from "jose";

// Pure sign/verify for the session JWT. Kept free of next/headers so it can be
// unit-tested in plain Node.

export interface SessionPayload {
  userId: string;
  email: string;
  isInternal: boolean;
}

const ISSUER = "scarred-steel-platform";
const AUDIENCE = "scarred-steel-session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set and at least 32 characters long.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.isInternal === "boolean"
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        isInternal: payload.isInternal,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "ss_session";
export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
