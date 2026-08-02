import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { writeAudit } from "../auditLog.ts";
import { isDeployPending, scheduleDeploy } from "../deployHook.ts";
import { getSlotDef, isValidSlot } from "../mediaCatalog.ts";
import { generateVariants } from "../mediaVariants.ts";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES, sniffMimeType } from "../mediaValidation.ts";
import { getR2Bucket, getR2Client } from "../r2.ts";
import { media } from "../schema.ts";
import { adminProcedure, router } from "../trpc.ts";

async function streamToBuffer(stream: unknown): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export const mediaRouter = router({
  list: adminProcedure.query(({ ctx }) => ctx.db.select().from(media)),

  deployStatus: adminProcedure.query(() => ({ pending: isDeployPending() })),

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
      return row;
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
      if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(input.mimeType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only WebP, JPEG, PNG, or SVG are allowed" });
      }
      if (input.bytes > MAX_UPLOAD_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "File is larger than 5 MB" });
      }

      const r2 = getR2Client();
      if (!r2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "R2 is not configured" });

      const tempKey = `uploads/tmp/${randomUUID()}`;
      const uploadUrl = await getSignedUrl(
        r2,
        new PutObjectCommand({ Bucket: getR2Bucket(), Key: tempKey, ContentType: input.mimeType }),
        { expiresIn: 300 }
      );

      return { uploadUrl, tempKey };
    }),

  confirmUpload: adminProcedure
    .input(z.object({ slot: z.string().min(1), tempKey: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const slotDef = getSlotDef(input.slot);
      if (!slotDef) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown slot" });

      const r2 = getR2Client();
      if (!r2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "R2 is not configured" });
      const bucket = getR2Bucket();

      const obj = await r2
        .send(new GetObjectCommand({ Bucket: bucket, Key: input.tempKey }))
        .catch(() => null);
      if (!obj?.Body) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload not found — please try again" });

      const buffer = await streamToBuffer(obj.Body);
      const mimeType = sniffMimeType(buffer);
      if (!mimeType) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "That file doesn't look like a WebP, JPEG, PNG, or SVG" });
      }
      if (buffer.length > MAX_UPLOAD_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "File is larger than 5 MB" });
      }

      const { variants, skipped, baseUndersized } = await generateVariants(slotDef, buffer, mimeType);

      for (const variant of Object.values(variants)) {
        await r2.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: variant.key,
            Body: variant.buffer,
            ContentType: mimeType === "image/svg+xml" ? "image/svg+xml" : "image/webp",
          })
        );
      }
      await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: input.tempKey })).catch(() => {});

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

      scheduleDeploy();

      const [row] = await ctx.db.select().from(media).where(eq(media.slot, input.slot));
      return { row, skipped, baseUndersized };
    }),
});
