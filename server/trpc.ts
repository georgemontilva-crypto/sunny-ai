import { TRPCError, initTRPC } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getDb } from "./db.ts";
import { validateSession } from "./session.ts";

export async function createContext({ req }: CreateExpressContextOptions) {
  const db = getDb();
  return {
    db,
    session: db ? await validateSession(db, req.headers.cookie) : null,
    ip: req.ip,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Requires a valid, unexpired session cookie whose user is still active
// (validateSession already filters out deactivated users). Both panel roles
// ('admin' and 'editor') pass this gate — it's the boundary between public
// and authenticated, not a strict admin-only check.
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not configured" });
  }
  return next({ ctx: { ...ctx, session: ctx.session, db: ctx.db } });
});
