import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auditLog } from "../schema.ts";
import { adminProcedure, router } from "../trpc.ts";

export const auditRouter = router({
  list: adminProcedure
    .input(
      z.object({
        userId: z.uuid().optional(),
        action: z.string().min(1).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.userId) conditions.push(eq(auditLog.userId, input.userId));
      if (input.action) conditions.push(eq(auditLog.action, input.action));
      const where = conditions.length ? and(...conditions) : undefined;

      const [rows, [{ total }]] = await Promise.all([
        ctx.db
          .select()
          .from(auditLog)
          .where(where)
          .orderBy(desc(auditLog.createdAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize),
        ctx.db.select({ total: count() }).from(auditLog).where(where),
      ]);

      return { rows, total, page: input.page, pageSize: input.pageSize };
    }),
});
