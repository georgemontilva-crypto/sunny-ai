// Resolves every catalog slot to a real URL (R2 if the DB answers,
// client/public paths otherwise) into client/src/generated/media-map.json,
// which client/src/lib/media.ts reads at build time. Two callers, two
// failure modes:
//   - `pnpm build` (no flag): a DB/R2 outage must NOT fail the build —
//     falls back to client/public and exits 0, same as always.
//   - server/republish.ts (--strict-on-error): a DB/R2 outage here must NOT
//     be swallowed. Overwriting the map with the fallback on a transient
//     failure would silently wipe every slot's real URL back to
//     client/public (or empty, for slots with no seed file) the moment
//     *any* upload triggers a republish — exactly the bug that shipped:
//     the panel reported "Published" while media-map.json quietly reverted
//     to blank. In strict mode, a DB failure leaves the existing file
//     untouched and exits 1, so republish() surfaces a real error instead
//     of a false "published".
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { MEDIA_SLOTS, type VariantName } from "../server/mediaCatalog.ts";
import { media } from "../server/schema.ts";

const OUT_FILE = path.resolve(import.meta.dirname, "..", "client", "src", "generated", "media-map.json");
const PUBLIC_DIR = path.resolve(import.meta.dirname, "..", "client", "public");
const STRICT = process.argv.includes("--strict-on-error");

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

// Only adds an entry when the file actually exists — a slot with neither a
// seed file in client/public nor a DB row (e.g. a brand-new catalog entry
// nobody has uploaded to yet) should resolve to nothing, not a guessed path
// that 404s. Components treat a missing entry as "show a placeholder."
function fallbackMap(): Record<string, Partial<Record<VariantName, string>>> {
  const map: Record<string, Partial<Record<VariantName, string>>> = {};
  for (const slotDef of MEDIA_SLOTS) {
    const entry: Partial<Record<VariantName, string>> = {};
    for (const variant of Object.keys(slotDef.variants) as VariantName[]) {
      const fileName = fallbackFileName(slotDef.slot, variant);
      if (fs.existsSync(path.join(PUBLIC_DIR, fileName))) {
        entry[variant] = `/${fileName}`;
      }
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
  const databaseUrl = process.env.DATABASE_URL;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!databaseUrl || !publicUrl) {
    console.log("[media-map] DATABASE_URL or R2_PUBLIC_URL not set, using client/public fallback");
    write(fallbackMap());
    return;
  }

  try {
    const connection = await mysql.createConnection(databaseUrl);
    const db = drizzle(connection, { schema: { media }, mode: "default" });
    const rows = await db.select().from(media);
    await connection.end();

    const resolved = fallbackMap();
    for (const row of rows) {
      const variants = row.variants as Record<string, { key: string }>;
      const entry: Partial<Record<VariantName, string>> = { ...resolved[row.slot] };
      // R2 serves the same key across replacements, so the URL itself has to
      // change or the browser (and any CDN in front) just keeps the old
      // bytes — updatedAt as a query param does that for free.
      const version = new Date(row.updatedAt).getTime();
      for (const [variant, data] of Object.entries(variants)) {
        entry[variant as VariantName] = `${publicUrl.replace(/\/$/, "")}/${data.key}?v=${version}`;
      }
      resolved[row.slot] = entry;
    }
    write(resolved);
    console.log(`[media-map] resolved ${rows.length} slot(s) from the database`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (STRICT) {
      console.error(`[media-map] DB/R2 lookup failed: ${message}`);
      console.error("[media-map] --strict-on-error: leaving the existing media-map.json untouched, failing");
      process.exitCode = 1;
      return;
    }
    console.error(`[media-map] DB/R2 lookup failed, using client/public fallback: ${message}`);
    write(fallbackMap());
  }
}

main();
