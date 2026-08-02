import { TRPCError, initTRPC } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getDb } from "./db.ts";
import { validateSession } from "./session.ts";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const db = getDb();
  return {
    db,
    res,
    // Resolved independently, from their own cookie — an admin session is
    // never even looked up while handling a member-scoped call, and vice
    // versa. See server/session.ts's top comment for the full reasoning.
    adminSession: db ? await validateSession(db, req.headers.cookie, "admin") : null,
    memberSession: db ? await validateSession(db, req.headers.cookie, "member") : null,
    ip: req.ip,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Requires a valid, unexpired admin-cookie session whose user is still
// active AND isn't a 'member' role. The cookie-name separation alone would
// stop a member's session id from ever being *read* here, but this checks
// the actual resolved role too — don't assume a session found under the
// admin cookie is automatically an admin/editor.
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not configured" });
  }
  if (!ctx.adminSession || ctx.adminSession.role === "member") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.adminSession, db: ctx.db } });
});

// Mirror of adminProcedure for the public member realm: valid member-cookie
// session, active user, and — explicitly, not assumed — role === 'member'.
export const memberProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not configured" });
  }
  if (!ctx.memberSession || ctx.memberSession.role !== "member") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.memberSession, db: ctx.db } });
});
