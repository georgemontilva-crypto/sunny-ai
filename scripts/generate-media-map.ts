// Pre-build step: resolves every catalog slot to a real URL (R2 if the DB
// answers, client/public paths otherwise) into
// client/src/generated/media-map.json, which client/src/lib/media.ts reads
// at build time. Must never throw — a DB/R2 outage here can't fail the build.
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { MEDIA_SLOTS, type VariantName } from "../server/mediaCatalog.ts";
import { media } from "../server/schema.ts";

const OUT_FILE = path.resolve(import.meta.dirname, "..", "client", "src", "generated", "media-map.json");

const SEED_OVERRIDES: Record<string, string> = {
  logo: "logo.png",
  "favicon-svg": "favicon.svg",
  "favicon-png": "favicon.png",
};

function fallbackFileName(slot: string, variant: VariantName): string {
  const base = SEED_OVERRIDES[slot] ?? `${slot}.webp`;
  if (variant === "base") return base;
  const ext = path.extname(base);
  const stem = base.slice(0, -ext.length);
  return variant === "2x" ? `${stem}@2x${ext}` : `${stem}-mobile${ext}`;
}

function fallbackMap(): Record<string, Partial<Record<VariantName, string>>> {
  const map: Record<string, Partial<Record<VariantName, string>>> = {};
  for (const slotDef of MEDIA_SLOTS) {
    const entry: Partial<Record<VariantName, string>> = {};
    for (const variant of Object.keys(slotDef.variants) as VariantName[]) {
      entry[variant] = `/${fallbackFileName(slotDef.slot, variant)}`;
    }
    map[slotDef.slot] = entry;
  }
  return map;
}

function write(data: unknown) {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function main() {
  const fallback = fallbackMap();
  const databaseUrl = process.env.DATABASE_URL;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!databaseUrl || !publicUrl) {
    console.log("[media-map] DATABASE_URL or R2_PUBLIC_URL not set, using client/public fallback");
    write(fallback);
    return;
  }

  try {
    const connection = await mysql.createConnection(databaseUrl);
    const db = drizzle(connection, { schema: { media }, mode: "default" });
    const rows = await db.select().from(media);
    await connection.end();

    const resolved = { ...fallback };
    for (const row of rows) {
      const variants = row.variants as Record<string, { key: string }>;
      const entry: Partial<Record<VariantName, string>> = { ...resolved[row.slot] };
      for (const [variant, data] of Object.entries(variants)) {
        entry[variant as VariantName] = `${publicUrl.replace(/\/$/, "")}/${data.key}`;
      }
      resolved[row.slot] = entry;
    }
    write(resolved);
    console.log(`[media-map] resolved ${rows.length} slot(s) from the database`);
  } catch (err) {
    console.error(
      "[media-map] DB/R2 lookup failed, using client/public fallback:",
      err instanceof Error ? err.message : err
    );
    write(fallback);
  }
}

main();
