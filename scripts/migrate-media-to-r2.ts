// One-time seed: uploads the images already sitting in client/public to R2
// and writes/updates their rows in the `media` table, so every slot in
// server/mediaCatalog.ts has real data before any admin ever uploads
// through the panel.
//
// Uploads the pre-made base/2x/mobile files as-is — it does NOT regenerate
// variants via sharp (that's server/mediaVariants.ts, used by the live
// confirmUpload flow for a newly-uploaded single file). These assets were
// already hand-sized; re-deriving them would just risk a quality mismatch.
//
// Usage:
//   pnpm exec tsx scripts/migrate-media-to-r2.ts [--dry-run]
//
// Requires DATABASE_URL always, and R2_ACCOUNT_ID / R2_ACCESS_KEY_ID /
// R2_SECRET_ACCESS_KEY / R2_BUCKET unless --dry-run.
import { randomUUID, createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import sharp from "sharp";
import { MEDIA_SLOTS, type VariantName } from "../server/mediaCatalog.ts";
import { getR2Bucket, getR2Client } from "../server/r2.ts";
import { media } from "../server/schema.ts";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "..", "client", "public");
const DRY_RUN = process.argv.includes("--dry-run");

const MIME_BY_EXT: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

// Slots whose seed filename doesn't mechanically match `${slot}.webp`.
const SEED_OVERRIDES: Record<string, string> = {
  logo: "logo.png",
  "favicon-svg": "favicon.svg",
  "favicon-png": "favicon.png",
};

function seedFileName(slot: string, variant: VariantName): string {
  const base = SEED_OVERRIDES[slot] ?? `${slot}.webp`;
  if (variant === "base") return base;
  const ext = path.extname(base);
  const stem = base.slice(0, -ext.length);
  return variant === "2x" ? `${stem}@2x${ext}` : `${stem}-mobile${ext}`;
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

async function dimensionsOf(buffer: Buffer): Promise<{ width: number; height: number }> {
  const meta = await sharp(buffer)
    .metadata()
    .catch(() => ({ width: 0, height: 0 }));
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[migrate-media] DATABASE_URL is not set");
    process.exit(1);
  }
  if (!DRY_RUN) {
    for (const key of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]) {
      if (!process.env[key]) {
        console.error(`[migrate-media] ${key} is not set`);
        process.exit(1);
      }
    }
  }

  const connection = await mysql.createConnection(databaseUrl);
  const db = drizzle(connection, { schema: { media }, mode: "default" });
  const r2 = DRY_RUN ? null : getR2Client();
  const bucket = DRY_RUN ? "" : getR2Bucket();

  let uploadedCount = 0;
  let skippedCount = 0;
  const emptySlots: string[] = [];

  for (const slotDef of MEDIA_SLOTS) {
    console.log(`${slotDef.slot}:`);
    const [existing] = await db.select().from(media).where(eq(media.slot, slotDef.slot));
    const existingVariants = (existing?.variants ?? {}) as Record<string, { hash?: string }>;

    const nextVariants: Record<string, unknown> = { ...existingVariants };
    let foundAny = false;
    let mimeType: string | undefined;

    for (const variantName of Object.keys(slotDef.variants) as VariantName[]) {
      const fileName = seedFileName(slotDef.slot, variantName);
      const filePath = path.join(PUBLIC_DIR, fileName);
      if (!fs.existsSync(filePath)) continue;

      foundAny = true;
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(fileName).toLowerCase();
      const variantMime = MIME_BY_EXT[ext] ?? "application/octet-stream";
      mimeType = mimeType ?? variantMime;
      const hash = sha256(buffer);

      if (existingVariants[variantName]?.hash === hash) {
        console.log(`  = ${variantName} unchanged (${fileName}), skipping`);
        skippedCount++;
        continue;
      }

      const { width, height } = await dimensionsOf(buffer);
      const key = `media/${slotDef.slot}/${variantName}${ext}`;

      if (DRY_RUN) {
        console.log(`  + ${variantName} <- ${fileName} (${width}x${height}, ${buffer.length}B) -> ${key}`);
      } else {
        await r2!.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: variantMime }));
        console.log(`  + ${variantName} uploaded -> ${key}`);
      }

      nextVariants[variantName] = { key, width, height, bytes: buffer.length, hash };
      uploadedCount++;
    }

    if (!foundAny) {
      console.log("  (no local file found)");
      emptySlots.push(slotDef.slot);
      continue;
    }

    if (!DRY_RUN) {
      await db
        .insert(media)
        .values({ id: randomUUID(), slot: slotDef.slot, variants: nextVariants, mimeType, alt: "" })
        .onDuplicateKeyUpdate({ set: { variants: nextVariants, mimeType, updatedAt: new Date() } });
    }
  }

  console.log(`\n${DRY_RUN ? "[dry run] " : ""}${uploadedCount} variant(s) uploaded, ${skippedCount} already up to date.`);
  if (emptySlots.length > 0) {
    console.log(`Slots with no local image found: ${emptySlots.join(", ")}`);
  } else {
    console.log("Every slot has at least a base image.");
  }

  await connection.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
