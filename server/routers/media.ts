import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { writeAudit } from "../auditLog.ts";
import { getSlotDef, isValidSlot } from "../mediaCatalog.ts";
import { generateVariants } from "../mediaVariants.ts";
import { tryR2PublicUrl } from "../r2.ts";
import { getPublishStatus, scheduleRepublish } from "../republish.ts";
import { media } from "../schema.ts";
import { adminProcedure, router } from "../trpc.ts";
import {
  createPresignedUpload,
  deleteObjectsQuietly,
  putVariants,
  readTempUpload,
  tempKeySchema,
} from "../uploads.ts";

// The panel needs today's actual R2 image, not the one baked into the
// client bundle at the last build/republish (that's what public pages use
// — fine for them, since they're static until the next republish, but the
// panel is live and must reflect a confirmUpload that just happened).
// Cache-busted with updatedAt because R2 serves the same key on every
// replace and the browser would otherwise keep showing the old bytes.
function withResolvedUrls<T extends { variants: unknown; updatedAt: Date }>(row: T) {
  const variants = row.variants as Record<string, { key: string; width: number; height: number; bytes: number }>;
  const version = new Date(row.updatedAt).getTime();
  const resolved: Record<string, { key: string; width: number; height: number; bytes: number; url: string | null }> = {};
  for (const [name, v] of Object.entries(variants)) {
    const url = tryR2PublicUrl(v.key);
    resolved[name] = { ...v, url: url ? `${url}?v=${version}` : null };
  }
  return { ...row, variants: resolved };
}

export const mediaRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(media);
    return rows.map(withResolvedUrls);
  }),

  publishStatus: adminProcedure.query(() => getPublishStatus()),

  updateAlt: adminProcedure
    .input(z.object({ slot: z.string().min(1), alt: z.string().max(300) }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select({ slot: media.slot }).from(media).where(eq(media.slot, input.slot));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "No image uploaded for this slot yet" });

      await ctx.db
        .update(media)
        .set({ alt: input.alt, updatedAt: new Date(), updatedBy: ctx.session.userId })
        .where(eq(media.slot, input.slot));

      await writeAudit(ctx.db, { userId: ctx.session.userId, action: "media.updateAlt", entity: input.slot });

      const [row] = await ctx.db.select().from(media).where(eq(media.slot, input.slot));
      return withResolvedUrls(row);
    }),

  requestUploadUrl: adminProcedure
    .input(
      z.object({
        slot: z.string().min(1),
        mimeType: z.string(),
        bytes: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      if (!isValidSlot(input.slot)) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown slot" });
      return createPresignedUpload(input);
    }),

  confirmUpload: adminProcedure
    .input(z.object({ slot: z.string().min(1), tempKey: tempKeySchema }))
    .mutation(async ({ ctx, input }) => {
      const slotDef = getSlotDef(input.slot);
      if (!slotDef) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown slot" });

      let result;
      try {
        const { buffer, mimeType } = await readTempUpload(input.tempKey);
        const generated = await generateVariants(
          slotDef.variants,
          buffer,
          mimeType,
          (name, ext) => `media/${slotDef.slot}/${name}.${ext}`
        );
        await putVariants(generated.variants, mimeType);
        result = { ...generated, mimeType };
      } finally {
        await deleteObjectsQuietly([input.tempKey]);
      }
      const { variants, skipped, baseUndersized, mimeType } = result;

      const storedVariants: Record<string, unknown> = {};
      for (const [name, v] of Object.entries(variants)) {
        storedVariants[name] = { key: v.key, width: v.width, height: v.height, bytes: v.bytes, hash: v.hash };
      }

      await ctx.db
        .insert(media)
        .values({
          id: randomUUID(),
          slot: input.slot,
          variants: storedVariants,
          mimeType,
          alt: "",
          updatedBy: ctx.session.userId,
        })
        .onDuplicateKeyUpdate({
          set: { variants: storedVariants, mimeType, updatedAt: new Date(), updatedBy: ctx.session.userId },
        });

      await writeAudit(ctx.db, {
        userId: ctx.session.userId,
        action: "media.replace",
        entity: input.slot,
        detail: { variants: Object.keys(variants), skipped, baseUndersized },
      });

      scheduleRepublish();

      const [row] = await ctx.db.select().from(media).where(eq(media.slot, input.slot));
      return { row: withResolvedUrls(row), skipped, baseUndersized };
    }),
});
