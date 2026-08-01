import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { writeAudit } from "../auditLog.ts";
import { requests } from "../schema.ts";
import { adminProcedure, router } from "../trpc.ts";

const statusEnum = z.enum(["new", "contacted", "closed", "spam"]);
const sourceEnum = z.enum(["contact", "partner", "newsletter"]);

const filterInput = z.object({
  status: statusEnum.optional(),
  source: sourceEnum.optional(),
  search: z.string().trim().max(200).optional(),
});

function buildWhere(input: z.infer<typeof filterInput>) {
  const conditions = [];
  if (input.status) conditions.push(eq(requests.status, input.status));
  if (input.source) conditions.push(eq(requests.source, input.source));
  if (input.search) {
    const term = `%${input.search}%`;
    conditions.push(or(like(requests.name, term), like(requests.email, term)));
  }
  return conditions.length ? and(...conditions) : undefined;
}

export const requestsRouter = router({
  list: adminProcedure
    .input(
      filterInput.extend({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = buildWhere(input);

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

  // Unpaginated, for "export what's filtered" — capped well above anything
  // a CSV download realistically needs, just to bound the query.
  export: adminProcedure.input(filterInput).query(({ ctx, input }) =>
    ctx.db.select().from(requests).where(buildWhere(input)).orderBy(desc(requests.createdAt)).limit(5000)
  ),

  setStatus: adminProcedure
    .input(z.object({ id: z.uuid(), status: statusEnum }))
    .mutation(async ({ ctx, input }) => {
      // MySQL has no RETURNING — check existence first, update, then
      // re-select the fresh row.
      const [existing] = await ctx.db.select({ id: requests.id }).from(requests).where(eq(requests.id, input.id));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.update(requests).set({ status: input.status }).where(eq(requests.id, input.id));

      await writeAudit(ctx.db, {
        userId: ctx.session.userId,
        action: "request.status",
        entity: input.id,
        detail: { status: input.status },
      });

      const [row] = await ctx.db.select().from(requests).where(eq(requests.id, input.id));
      return row;
    }),

  setNotes: adminProcedure
    .input(z.object({ id: z.uuid(), notes: z.string().max(5000) }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select({ id: requests.id }).from(requests).where(eq(requests.id, input.id));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.update(requests).set({ notes: input.notes }).where(eq(requests.id, input.id));

      await writeAudit(ctx.db, {
        userId: ctx.session.userId,
        action: "request.notes",
        entity: input.id,
      });

      const [row] = await ctx.db.select().from(requests).where(eq(requests.id, input.id));
      return row;
    }),

  delete: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select({ id: requests.id }).from(requests).where(eq(requests.id, input.id));
    if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

    await ctx.db.delete(requests).where(eq(requests.id, input.id));

    await writeAudit(ctx.db, {
      userId: ctx.session.userId,
      action: "request.delete",
      entity: input.id,
    });

    return { ok: true };
  }),
});
