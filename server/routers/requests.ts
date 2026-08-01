import { TRPCError } from "@trpc/server";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { writeAudit } from "../auditLog.ts";
import { requests } from "../schema.ts";
import { adminProcedure, router } from "../trpc.ts";

const statusEnum = z.enum(["new", "contacted", "closed", "spam"]);

export const requestsRouter = router({
  list: adminProcedure
    .input(
      z.object({
        status: statusEnum.optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = input.status ? eq(requests.status, input.status) : undefined;

      const [rows, [{ total }]] = await Promise.all([
        ctx.db
          .select()
          .from(requests)
          .where(where)
          .orderBy(desc(requests.createdAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize),
        ctx.db.select({ total: count() }).from(requests).where(where),
      ]);

      return { rows, total, page: input.page, pageSize: input.pageSize };
    }),

  setStatus: adminProcedure
    .input(z.object({ id: z.uuid(), status: statusEnum }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(requests)
        .set({ status: input.status })
        .where(eq(requests.id, input.id))
        .returning();

      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      await writeAudit(ctx.db, {
        userId: ctx.session.userId,
        action: "request.status",
        entity: input.id,
        detail: { status: input.status },
      });

      return row;
    }),

  setNotes: adminProcedure
    .input(z.object({ id: z.uuid(), notes: z.string().max(5000) }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(requests)
        .set({ notes: input.notes })
        .where(eq(requests.id, input.id))
        .returning();

      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      await writeAudit(ctx.db, {
        userId: ctx.session.userId,
        action: "request.notes",
        entity: input.id,
      });

      return row;
    }),

  delete: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.db.delete(requests).where(eq(requests.id, input.id)).returning();

    if (!row) throw new TRPCError({ code: "NOT_FOUND" });

    await writeAudit(ctx.db, {
      userId: ctx.session.userId,
      action: "request.delete",
      entity: input.id,
    });

    return { ok: true };
  }),
});
