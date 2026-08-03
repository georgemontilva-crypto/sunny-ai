// Resolves the settings table's partner-page keys into
// client/src/generated/settings-map.json, which client/src/lib/settings.ts
// reads at build time — the same shape of problem generate-media-map.ts
// solves for images, for plain strings instead of R2 URLs.
//
// Two callers, two failure modes, same reasoning as generate-media-map.ts:
//   - `pnpm build` (no flag): a DB outage must NOT fail the build — every
//     key falls back to "" (PartnerPage shows its dashed placeholder / hides
//     the contact line), exit 0.
//   - server/republish.ts (--strict-on-error): a DB outage must NOT be
//     swallowed into a false "published" that silently blanks every price
//     on the live site. Leaves the existing settings-map.json untouched and
//     exits 1.
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { settings } from "../server/schema.ts";

const OUT_FILE = path.resolve(import.meta.dirname, "..", "client", "src", "generated", "settings-map.json");
const STRICT = process.argv.includes("--strict-on-error");

// The only keys PartnerPage ever reads — anything else in the settings
// table (contact_email, newsletter_email, ...) is read live at request
// time elsewhere and has no business in a static build artifact.
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
const partnerKeySet: ReadonlySet<string> = new Set(PARTNER_KEYS);

function write(data: Record<string, string>) {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function resolveFromDatabase(databaseUrl: string): Promise<Record<string, string>> {
  const connection = await mysql.createConnection(databaseUrl);
  let rows: { key: string; value: string }[];
  try {
    const db = drizzle(connection, { schema: { settings }, mode: "default" });
    rows = await db.select({ key: settings.key, value: settings.value }).from(settings);
  } finally {
    await connection.end().catch(() => {});
  }

  const map: Record<string, string> = {};
  for (const row of rows) {
    if (partnerKeySet.has(row.key) && row.value) map[row.key] = row.value;
  }
  console.log(`[settings-map] resolved ${Object.keys(map).length} of ${PARTNER_KEYS.length} known key(s)`);
  return map;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("[settings-map] DATABASE_URL not set — every key falls back to empty (placeholder/hidden)");
    write({});
    return;
  }

  try {
    write(await resolveFromDatabase(databaseUrl));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (STRICT) {
      console.error(`[settings-map] FAILED: ${message}`);
      console.error("[settings-map] --strict-on-error: leaving the existing settings-map.json untouched, failing");
      process.exitCode = 1;
      return;
    }
    console.error(`[settings-map] FAILED, using empty fallback for every key: ${message}`);
    write({});
  }
}

main();
