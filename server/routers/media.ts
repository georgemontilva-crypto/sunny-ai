import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { writeAudit } from "../auditLog.ts";
import { media } from "../schema.ts";
import { adminProcedure, router } from "../trpc.ts";

export const mediaRouter = router({
  list: adminProcedure.query(({ ctx }) => ctx.db.select().from(media)),

  updateAlt: adminProcedure
    .input(z.object({ slot: z.string().min(1), alt: z.string().max(300) }))
    .mutation(async ({ ctx, input }) => {
      // MySQL has no RETURNING — check existence first, update, re-select.
      const [existing] = await ctx.db.select({ slot: media.slot }).from(media).where(eq(media.slot, input.slot));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "No image uploaded for this slot yet" });

      await ctx.db
        .update(media)
        .set({ alt: input.alt, updatedAt: new Date(), updatedBy: ctx.session.userId })
        .where(eq(media.slot, input.slot));

      await writeAudit(ctx.db, {
        userId: ctx.session.userId,
        action: "media.updateAlt",
        entity: input.slot,
      });

      const [row] = await ctx.db.select().from(media).where(eq(media.slot, input.slot));
      return row;
    }),

  // R2 presigned-upload flow (slot catalog, magic-byte validation, deploy
  // hook debounce) is built in Fase 5. Scaffolded here so the router shape
  // is stable for the panel to call against once it lands.
  requestUploadUrl: adminProcedure
    .input(z.object({ slot: z.string().min(1), mimeType: z.string(), bytes: z.number().int().positive() }))
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Media upload lands in Fase 5" });
    }),

  confirmUpload: adminProcedure
    .input(
      z.object({
        slot: z.string().min(1),
        r2Key: z.string().min(1),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
    )
    .mutation(() => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Media upload lands in Fase 5" });
    }),
});
