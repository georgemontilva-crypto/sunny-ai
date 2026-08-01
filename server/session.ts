// Stateless, signed session cookie — no session table. The cookie carries
// {userId, role, exp} plus an HMAC-SHA256 signature keyed by SESSION_SECRET;
// logout just clears the cookie (nothing to revoke server-side, so a copied
// cookie stays valid for the rest of its 8h window).
import { createHmac, timingSafeEqual } from "node:crypto";
import { parseCookie, stringifySetCookie } from "cookie";

const COOKIE_NAME = "sunny_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface SessionPayload {
  userId: string;
  role: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

// Throws at startup (called from server/index.ts before listen()) rather
// than lazily on first request, so a misconfigured deploy fails loudly.
export function assertSessionSecret(): void {
  getSecret();
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Secure requires HTTPS, which is only how the site is actually reached in
// production (Railway edge terminates TLS); a plain `node server/index.ts`
// against localhost:3001 in dev has no HTTPS to send the cookie back over.
const SECURE_COOKIE = process.env.NODE_ENV === "production";

export function createSessionCookie(payload: Omit<SessionPayload, "exp">): string {
  const full: SessionPayload = { ...payload, exp: Date.now() + SESSION_TTL_MS };
  const data = Buffer.from(JSON.stringify(full), "utf-8").toString("base64url");
  const signature = sign(data);
  const value = `${data}.${signature}`;

  return stringifySetCookie({
    name: COOKIE_NAME,
    value,
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(): string {
  return stringifySetCookie({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function readSession(cookieHeader: string | undefined): SessionPayload | null {
  if (!cookieHeader) return null;
  const cookies = parseCookie(cookieHeader);
  const value = cookies[COOKIE_NAME];
  if (!value) return null;

  const dotIndex = value.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const data = value.slice(0, dotIndex);
  const signature = value.slice(dotIndex + 1);

  if (!safeEqual(sign(data), signature)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
  } catch {
    return null;
  }

  if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  if (typeof payload.userId !== "string" || typeof payload.role !== "string") return null;

  return payload;
}
