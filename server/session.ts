// DB-backed sessions. The cookie carries only the opaque session id (a
// crypto.randomUUID(), 122 bits of entropy) — it's a lookup key, not a
// token that encodes trust, so nothing needs signing. Every request
// re-validates against the sessions table and checks the owning user is
// still active, which is what makes revocation (logout, deactivating a
// user) actually work.
//
// Two realms, two cookie names, one underlying table: an admin-panel login
// and a public member login both create a row in `sessions` (a session is
// just "this id ↔ this user"), but each is written to and read from its
// own cookie name, so an admin session is never even *looked at* by a
// member-scoped call and vice versa. That structural separation alone
// isn't the whole story — see server/trpc.ts's adminProcedure/
// memberProcedure, which also check the resolved user's `role` explicitly
// rather than trusting "found under the admin cookie" as sufficient.
import { randomUUID } from "node:crypto";
import { and, eq, gt, lte } from "drizzle-orm";
import { parseCookie, stringifySetCookie } from "cookie";
import type { Db } from "./db.ts";
import { sessions, users } from "./schema.ts";

export type SessionRealm = "admin" | "member";

const COOKIE_NAMES: Record<SessionRealm, string> = {
  admin: "sunny_session",
  member: "sunny_member_session",
};
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SessionContext {
  sessionId: string;
  userId: string;
  email: string;
  role: string;
}

// Secure requires HTTPS, which is only how the site is actually reached in
// production (Railway edge terminates TLS); a plain `node server/index.ts`
// against localhost:3001 in dev has no HTTPS to send the cookie back over.
const SECURE_COOKIE = process.env.NODE_ENV === "production";

function cookieFor(realm: SessionRealm, sessionId: string, maxAgeSeconds: number): string {
  return stringifySetCookie({
    name: COOKIE_NAMES[realm],
    value: sessionId,
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export function readSessionCookie(cookieHeader: string | undefined, realm: SessionRealm): string | null {
  if (!cookieHeader) return null;
  const value = parseCookie(cookieHeader)[COOKIE_NAMES[realm]];
  return value && UUID_RE.test(value) ? value : null;
}

export async function createSession(
  db: Db,
  realm: SessionRealm,
  input: { userId: string; ip?: string; userAgent?: string }
): Promise<string> {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db
    .insert(sessions)
    .values({ id, userId: input.userId, expiresAt, ip: input.ip, userAgent: input.userAgent });

  return cookieFor(realm, id, SESSION_TTL_MS / 1000);
}

export async function destroySession(
  db: Db,
  realm: SessionRealm,
  cookieHeader: string | undefined
): Promise<string> {
  const sessionId = readSessionCookie(cookieHeader, realm);
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  return cookieFor(realm, "", 0);
}

export async function validateSession(
  db: Db,
  cookieHeader: string | undefined,
  realm: SessionRealm
): Promise<SessionContext | null> {
  const sessionId = readSessionCookie(cookieHeader, realm);
  if (!sessionId) return null;

  const now = new Date();

  // Lazy cleanup: sweep this user's expired rows whenever we hit one, no
  // separate cron needed for a table this small.
  const [row] = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)));

  if (!row) {
    await db.delete(sessions).where(and(eq(sessions.id, sessionId), lte(sessions.expiresAt, now)));
    return null;
  }

  if (!row.isActive) return null;

  return { sessionId: row.sessionId, userId: row.userId, email: row.email, role: row.role };
}
