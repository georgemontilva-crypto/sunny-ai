import argon2 from "argon2";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { conversations, users } from "../schema.ts";
import { destroySession } from "../session.ts";
import { memberProcedure, publicProcedure, router } from "../trpc.ts";

export const memberRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.memberSession || ctx.memberSession.role !== "member") return null;
    const { userId, email } = ctx.memberSession;
    return { id: userId, email };
  }),

  changePassword: memberProcedure
    .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.session.userId));
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const valid = await argon2.verify(user.passwordHash, input.currentPassword).catch(() => false);
      if (!valid) throw new TRPCError({ code: "BAD_REQUEST", message: "Current password is incorrect" });

      const passwordHash = await argon2.hash(input.newPassword, { type: argon2.argon2id });
      await ctx.db.update(users).set({ passwordHash }).where(eq(users.id, ctx.session.userId));
      return { ok: true };
    }),

  // Real delete, not a soft flag — the privacy commitment in
  // /legal/privacy promises this is permanent.
  deleteConversationHistory: memberProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(conversations).where(eq(conversations.userId, ctx.session.userId));
    return { ok: true };
  }),

  // Deleting the user row cascades to sessions, conversations, and
  // messages via their FKs (server/schema.ts) — one statement removes
  // everything this account owns.
  deleteAccount: memberProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(users).where(eq(users.id, ctx.session.userId));
    // The session row is already gone via cascade — this only needs to
    // clear the browser's cookie, not look anything up.
    ctx.res.setHeader("Set-Cookie", await destroySession(ctx.db, "member", undefined));
    return { ok: true };
  }),
});
