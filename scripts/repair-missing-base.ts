// One-off repair for the "base missing" bug: any slot uploaded through the
// live admin panel while server/mediaVariants.ts skipped the base variant
// when the source was smaller than the declared target. Finds rows with no
// `variants.base`, and if a "2x" variant exists, derives base by resizing
// it DOWN (2x is always >= base's target, so this never upscales). Rows
// with neither base nor 2x can't be repaired automatically — they need a
// manual re-upload through the panel.
//
// Usage: pnpm exec tsx scripts/repair-missing-base.ts [--dry-run]
import { createHash, randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import sharp from "sharp";
import { getSlotDef } from "../server/mediaCatalog.ts";
import { getR2Bucket, getR2Client } from "../server/r2.ts";
import { media } from "../server/schema.ts";

const DRY_RUN = process.argv.includes("--dry-run");

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

async function streamToBuffer(stream: unknown): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[repair-base] DATABASE_URL is not set");
    process.exit(1);
  }
  for (const key of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]) {
    if (!process.env[key]) {
      console.error(`[repair-base] ${key} is not set`);
      process.exit(1);
    }
  }

  const connection = await mysql.createConnection(databaseUrl);
  const db = drizzle(connection, { schema: { media }, mode: "default" });
  const r2 = getR2Client()!;
  const bucket = getR2Bucket();

  const rows = await db.select().from(media);
  let repaired = 0;
  let needsManualUpload = 0;

  for (const row of rows) {
    const variants = row.variants as Record<string, { key: string; width: number; height: number; bytes: number }>;
    if (variants.base) continue;

    const twoX = variants["2x"];
    if (!twoX) {
      console.log(`! ${row.slot}: no base and no 2x either — needs a manual re-upload`);
      needsManualUpload++;
      continue;
    }

    const slotDef = getSlotDef(row.slot);
    const targetWidth = slotDef?.variants.base?.width;

    console.log(`${row.slot}: deriving base from 2x (${twoX.width}w)${targetWidth ? ` -> ${targetWidth}w` : " (native)"}`);
    if (DRY_RUN) {
      repaired++;
      continue;
    }

    const obj = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: twoX.key }));
    const sourceBuffer = await streamToBuffer(obj.Body);

    const pipeline = targetWidth ? sharp(sourceBuffer).resize({ width: targetWidth }) : sharp(sourceBuffer);
    const buffer = await pipeline.webp({ quality: 82 }).toBuffer();
    const meta = await sharp(buffer).metadata();
    const key = `media/${row.slot}/base.webp`;

    await r2.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: "image/webp" }));

    const nextVariants = {
      ...variants,
      base: { key, width: meta.width ?? targetWidth ?? twoX.width, height: meta.height ?? 0, bytes: buffer.length, hash: sha256(buffer) },
    };
    await db.update(media).set({ variants: nextVariants, updatedAt: new Date() }).where(eq(media.slot, row.slot));
    repaired++;
  }

  console.log(
    `\n${DRY_RUN ? "[dry run] " : ""}${repaired} slot(s) repaired, ${needsManualUpload} need a manual re-upload.`
  );
  await connection.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
