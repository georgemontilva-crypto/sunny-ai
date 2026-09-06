// Resolves the published rows of the `posts` table into
// client/src/generated/blog-map.json, which client/src/lib/blog.ts reads at
// build time — the same shape of problem generate-media-map.ts solves for
// images and generate-settings-map.ts for partner-page strings, for the
// blog's content.
//
// Only status = 'published' rows are ever written. A draft has no entry, so
// it gets no prerendered page, no /blog card and no sitemap line: saving a
// draft genuinely changes nothing public, which is why /admin/blog doesn't
// republish on save.
//
// Two callers, two failure modes, same reasoning as the other two
// generators:
//   - `pnpm build` (no flag): a DB outage must NOT fail the build — writes
//     an empty list (the blog renders its "nothing yet" state), exit 0, and
//     server/republish.ts's startup check re-runs this once the private
//     network is up.
//   - server/republish.ts (--strict-on-error): a DB outage must NOT be
//     swallowed into a false "published" that silently unpublishes every
//     article on the live site. Leaves the existing blog-map.json untouched
//     and exits 1.
import fs from "node:fs";
import path from "node:path";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { readingTimeMinutes, type BlogPost } from "../shared/blog.ts";
import { posts } from "../server/schema.ts";

const OUT_FILE = path.resolve(import.meta.dirname, "..", "client", "src", "generated", "blog-map.json");
const STRICT = process.argv.includes("--strict-on-error");

function write(data: BlogPost[]) {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function toIso(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

async function resolveFromDatabase(databaseUrl: string): Promise<BlogPost[]> {
  const connection = await mysql.createConnection(databaseUrl);
  let rows: (typeof posts.$inferSelect)[];
  try {
    const db = drizzle(connection, { schema: { posts }, mode: "default" });
    rows = await db
      .select()
      .from(posts)
      // publishedAt is what the public list is ordered and dated by, so a
      // row that's somehow marked published without one is skipped rather
      // than rendered with an empty date. The router always sets both
      // together; this is the belt to that braces.
      .where(and(eq(posts.status, "published"), isNotNull(posts.publishedAt)))
      .orderBy(desc(posts.publishedAt));
  } finally {
    await connection.end().catch(() => {});
  }

  // Every nullable column is normalized to "" here, once, so the public
  // pages never null-check a value they only ever render.
  const map: BlogPost[] = rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.content,
    category: row.category ?? "",
    coverSlot: row.coverSlot ?? "",
    lang: row.lang,
    publishedAt: toIso(row.publishedAt),
    updatedAt: toIso(row.updatedAt),
    metaTitle: row.metaTitle ?? "",
    metaDescription: row.metaDescription ?? "",
    readingTimeMinutes: readingTimeMinutes(row.content),
  }));

  console.log(`[blog-map] resolved ${map.length} published post(s)`);
  for (const post of map.slice(0, 5)) {
    console.log(`[blog-map]   /blog/${post.slug} — "${post.title}" (${post.lang})`);
  }
  return map;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("[blog-map] DATABASE_URL not set — no posts, /blog renders its empty state");
    write([]);
    return;
  }

  try {
    write(await resolveFromDatabase(databaseUrl));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (STRICT) {
      console.error(`[blog-map] FAILED: ${message}`);
      console.error("[blog-map] --strict-on-error: leaving the existing blog-map.json untouched, failing");
      process.exitCode = 1;
      return;
    }
    console.error(`[blog-map] FAILED during build: ${message}`);
    console.error(
      "[blog-map] the blog will be empty in this build — expected if the database isn't reachable at build " +
        "time (e.g. Railway's mysql.railway.internal only resolves at runtime, not during the build phase). " +
        "This resolves automatically: server/republish.ts re-runs this at server startup once the private " +
        "network is up (see republishIfGeneratedMapsAreEmpty in server/republish.ts)."
    );
    write([]);
  }
}

main();
