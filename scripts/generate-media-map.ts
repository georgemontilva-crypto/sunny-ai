// Resolves every catalog slot to a real URL (R2 if the DB answers,
// client/public paths otherwise) into client/src/generated/media-map.json,
// which client/src/lib/media.ts reads at build time.
//
// Fallback philosophy: client/public is ONLY a legitimate answer for a slot
// that has no database row at all — never for a slot that DOES have a row.
// A row whose variants can't be turned into a usable R2 URL is a bug (bad
// JSON shape, missing R2_PUBLIC_URL, whatever), not a degraded-but-fine
// state, so it throws instead of quietly reverting that slot to
// client/public. Three previous bugs all had the same symptom — a slot
// silently falling back to its old image — because every one of them failed
// toward the same safe-looking default. This fails loud instead.
//
// Two callers, two failure modes:
//   - `pnpm build` (no flag): a DB/R2 outage must NOT fail the build — logs
//     the failure and falls back to client/public for every slot, exit 0.
//   - server/republish.ts (--strict-on-error): a DB/R2 outage, or a
//     resolution failure for any slot that has a row, must NOT be
//     swallowed. Leaves the existing media-map.json untouched and exits 1,
//     so republish() surfaces a real error instead of a false "published".
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { MEDIA_SLOTS, type VariantName } from "../server/mediaCatalog.ts";
import { media } from "../server/schema.ts";

const OUT_FILE = path.resolve(import.meta.dirname, "..", "client", "src", "generated", "media-map.json");
const PUBLIC_DIR = path.resolve(import.meta.dirname, "..", "client", "public");
const STRICT = process.argv.includes("--strict-on-error");

type ResolvedMap = Record<string, Partial<Record<VariantName, string>>>;
type StoredVariant = { key: string; width: number; height: number; bytes: number; hash?: string };
type StoredVariants = Partial<Record<VariantName, StoredVariant>>;

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
function fallbackEntry(slot: string, declaredVariants: VariantName[]): Partial<Record<VariantName, string>> {
  const entry: Partial<Record<VariantName, string>> = {};
  for (const variant of declaredVariants) {
    const fileName = fallbackFileName(slot, variant);
    if (fs.existsSync(path.join(PUBLIC_DIR, fileName))) {
      entry[variant] = `/${fileName}`;
    }
  }
  return entry;
}

function fallbackMap(): ResolvedMap {
  const map: ResolvedMap = {};
  for (const slotDef of MEDIA_SLOTS) {
    map[slotDef.slot] = fallbackEntry(slotDef.slot, Object.keys(slotDef.variants) as VariantName[]);
  }
  return map;
}

function write(data: unknown) {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// mysql2 normally auto-parses JSON columns into objects, but this has
// silently been a plain string in some code path before — handle both so a
// driver-shape surprise can't masquerade as "no data".
function parseVariants(raw: unknown): StoredVariants | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw as StoredVariants;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as StoredVariants;
    } catch {
      return null;
    }
  }
  return null;
}

function logEnvPresence() {
  const keys = ["DATABASE_URL", "R2_PUBLIC_URL", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];
  console.log(`[media-map] env: ${keys.map((k) => `${k}=${process.env[k] ? "present" : "MISSING"}`).join(" ")}`);
}

async function resolveFromDatabase(databaseUrl: string, publicUrl: string): Promise<ResolvedMap> {
  const connection = await mysql.createConnection(databaseUrl);
  let rows: { slot: string; variants: unknown; updatedAt: Date | string }[];
  try {
    const db = drizzle(connection, { schema: { media }, mode: "default" });
    rows = await db.select().from(media);
  } finally {
    await connection.end().catch(() => {});
  }

  console.log(`[media-map] query returned ${rows.length} row(s)`);
  for (const row of rows.slice(0, 3)) {
    console.log(
      `[media-map] sample row "${row.slot}": variants typeof=${typeof row.variants}, raw=${JSON.stringify(row.variants)?.slice(0, 300)}`
    );
  }

  const rowsBySlot = new Map(rows.map((r) => [r.slot, r]));
  const resolved: ResolvedMap = {};
  let fromR2 = 0;
  let fromFallback = 0;

  for (const slotDef of MEDIA_SLOTS) {
    const row = rowsBySlot.get(slotDef.slot);
    const declaredVariants = Object.keys(slotDef.variants) as VariantName[];

    if (!row) {
      resolved[slotDef.slot] = fallbackEntry(slotDef.slot, declaredVariants);
      fromFallback++;
      continue;
    }

    const variants = parseVariants(row.variants);
    if (!variants || !variants.base || typeof variants.base.key !== "string") {
      throw new Error(
        `Slot "${slotDef.slot}" has a database row but its variants can't be resolved to a usable base key ` +
          `(typeof row.variants: ${typeof row.variants}, raw: ${JSON.stringify(row.variants)})`
      );
    }

    const version = new Date(row.updatedAt).getTime();
    const entry: Partial<Record<VariantName, string>> = {};
    for (const [variantName, data] of Object.entries(variants)) {
      if (!data || typeof data.key !== "string") {
        throw new Error(`Slot "${slotDef.slot}" variant "${variantName}" has no usable key (${JSON.stringify(data)})`);
      }
      entry[variantName as VariantName] = `${publicUrl.replace(/\/$/, "")}/${data.key}?v=${version}`;
    }
    resolved[slotDef.slot] = entry;
    fromR2++;
  }

  console.log(`[media-map] resolved ${fromR2} slot(s) from R2, ${fromFallback} from client/public (no row in the database)`);
  for (const slot of ["hero-bg", "meet-sunny", "partner-hero"]) {
    if (resolved[slot]) console.log(`[media-map] ${slot} -> ${JSON.stringify(resolved[slot])}`);
  }

  return resolved;
}

async function main() {
  logEnvPresence();

  const databaseUrl = process.env.DATABASE_URL;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!databaseUrl || !publicUrl) {
    console.log("[media-map] DATABASE_URL or R2_PUBLIC_URL not set — every slot falls back to client/public");
    write(fallbackMap());
    return;
  }

  try {
    write(await resolveFromDatabase(databaseUrl, publicUrl));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (STRICT) {
      console.error(`[media-map] FAILED: ${message}`);
      console.error("[media-map] --strict-on-error: leaving the existing media-map.json untouched, failing");
      process.exitCode = 1;
      return;
    }
    console.error(`[media-map] FAILED, using client/public fallback for every slot: ${message}`);
    write(fallbackMap());
  }
}

main();
