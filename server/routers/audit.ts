import { count, desc } from "drizzle-orm";
import { z } from "zod";
import { auditLog } from "../schema.ts";
import { adminProcedure, router } from "../trpc.ts";

export const auditRouter = router({
  list: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      const [rows, [{ total }]] = await Promise.all([
        ctx.db
          .select()
          .from(auditLog)
          .orderBy(desc(auditLog.createdAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize),
        ctx.db.select({ total: count() }).from(auditLog),
      ]);

      return { rows, total, page: input.page, pageSize: input.pageSize };
    }),
});
