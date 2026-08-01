import { eq } from "drizzle-orm";
import { z } from "zod";
import { writeAudit } from "../auditLog.ts";
import { settings } from "../schema.ts";
import { adminProcedure, router } from "../trpc.ts";

// SITE.indexable is deliberately not a settings key — it stays in
// shared/site.ts as the source of truth, changed only by commit, so a DB
// outage during build can never silently flip the site indexable.
const settingsKey = z.enum(["contact_email", "newsletter_email"]);

export const settingsRouter = router({
  getAll: adminProcedure.query(({ ctx }) => ctx.db.select().from(settings)),

  update: adminProcedure
    .input(z.object({ key: settingsKey, value: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      // MySQL has no RETURNING or Postgres-style onConflictDoUpdate —
      // upsert via ON DUPLICATE KEY UPDATE, then re-select the fresh row.
      await ctx.db
        .insert(settings)
        .values({ key: input.key, value: input.value })
        .onDuplicateKeyUpdate({ set: { value: input.value, updatedAt: new Date() } });

      await writeAudit(ctx.db, {
        userId: ctx.session.userId,
        action: "settings.update",
        entity: input.key,
        detail: { value: input.value },
      });

      const [row] = await ctx.db.select().from(settings).where(eq(settings.key, input.key));
      return row;
    }),
});
