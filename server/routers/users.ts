import { randomBytes, randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { writeAudit } from "../auditLog.ts";
import type { Db } from "../db.ts";
import { users } from "../schema.ts";
import { adminProcedure, router } from "../trpc.ts";

const roleEnum = z.enum(["admin", "editor"]);

async function activeAdminCountExcluding(db: Db, excludeId: string) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.isActive, true), ne(users.id, excludeId)));
  return total;
}

export const usersRouter = router({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
  ),

  invite: adminProcedure
    .input(z.object({ email: z.string().trim().email(), role: roleEnum }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select({ id: users.id }).from(users).where(eq(users.email, input.email));
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "That email already has an account" });

      // No outbound email is wired up server-side (Resend lives only in the
      // contact Worker) — generate a one-time password and show it once so
      // the admin can relay it themselves, rather than pretending to email it.
      const tempPassword = randomBytes(12).toString("base64url");
      const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

      const id = randomUUID();
      await ctx.db.insert(users).values({ id, email: input.email, passwordHash, role: input.role });

      await writeAudit(ctx.db, { userId: ctx.session.userId, action: "user.invite", entity: id, detail: { email: input.email, role: input.role } });

      return { id, email: input.email, tempPassword };
    }),

  setRole: adminProcedure
    .input(z.object({ id: z.uuid(), role: roleEnum }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.session.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You can't change your own role" });
      }

      const [target] = await ctx.db.select().from(users).where(eq(users.id, input.id));
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      if (target.role === "admin" && input.role !== "admin" && target.isActive) {
        const remaining = await activeAdminCountExcluding(ctx.db, input.id);
        if (remaining === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "There must be at least one active admin" });
        }
      }

      await ctx.db.update(users).set({ role: input.role }).where(eq(users.id, input.id));
      await writeAudit(ctx.db, { userId: ctx.session.userId, action: "user.setRole", entity: input.id, detail: { role: input.role } });

      const [row] = await ctx.db
        .select({ id: users.id, email: users.email, role: users.role, isActive: users.isActive, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt })
        .from(users)
        .where(eq(users.id, input.id));
      return row;
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.session.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You can't deactivate your own account" });
      }

      const [target] = await ctx.db.select().from(users).where(eq(users.id, input.id));
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      if (!input.isActive && target.role === "admin" && target.isActive) {
        const remaining = await activeAdminCountExcluding(ctx.db, input.id);
        if (remaining === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "There must be at least one active admin" });
        }
      }

      await ctx.db.update(users).set({ isActive: input.isActive }).where(eq(users.id, input.id));
      await writeAudit(ctx.db, {
        userId: ctx.session.userId,
        action: input.isActive ? "user.activate" : "user.deactivate",
        entity: input.id,
      });

      const [row] = await ctx.db
        .select({ id: users.id, email: users.email, role: users.role, isActive: users.isActive, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt })
        .from(users)
        .where(eq(users.id, input.id));
      return row;
    }),
});
