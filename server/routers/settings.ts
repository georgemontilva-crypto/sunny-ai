import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { writeAudit } from "../auditLog.ts";
import { scheduleRepublish } from "../republish.ts";
import { settings } from "../schema.ts";
import { adminProcedure, router } from "../trpc.ts";

// SITE.indexable is deliberately not a settings key — it stays in
// shared/site.ts as the source of truth, changed only by commit, so a DB
// outage during build can never silently flip the site indexable.
const REQUIRED_KEYS = ["contact_email", "newsletter_email"] as const;
// Baked into the static /partner build by scripts/generate-settings-map.ts,
// same as media slots — an empty value is a legitimate, supported state
// (shows the page's dashed placeholder / hides the contact line), so these
// allow saving "" to explicitly clear back to that state.
const PARTNER_KEYS = [
  "plan_standard_price",
  "plan_standard_period",
  "plan_standard_setup",
  "plan_standard_note",
  "plan_whitelabel_price",
  "plan_whitelabel_note",
  "partner_contact_phone",
  "partner_contact_email",
] as const;
const settingsKey = z.enum([...REQUIRED_KEYS, ...PARTNER_KEYS]);
const partnerKeySet: ReadonlySet<string> = new Set(PARTNER_KEYS);

export const settingsRouter = router({
  getAll: adminProcedure.query(({ ctx }) => ctx.db.select().from(settings)),

  update: adminProcedure
    .input(z.object({ key: settingsKey, value: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      if (!partnerKeySet.has(input.key) && input.value.trim() === "") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This setting can't be cleared to empty" });
      }

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

      // Partner-page settings are resolved into the static build at
      // build/republish time (client/src/lib/settings.ts), not fetched at
      // runtime — same reason media slots need a republish after a change.
      if (partnerKeySet.has(input.key)) scheduleRepublish();

      const [row] = await ctx.db.select().from(settings).where(eq(settings.key, input.key));
      return row;
    }),
});
