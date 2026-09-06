// One-shot migration: content/blog/*.mdx -> the `posts` table.
//
// Run it once, against the real database, before content/blog/ is deleted:
//
//   DATABASE_URL='mysql://…' pnpm migrate:blog -- --dry-run   # shows the plan
//   DATABASE_URL='mysql://…' pnpm migrate:blog                # writes
//
// Every post is inserted as lang 'es', status 'draft' — the two existing
// articles are in Spanish and the site is in English, so they must not go
// live again just because they moved into the database. Whoever decides
// what to do with them (translate, republish as-is, drop) does it from
// /admin/blog.
//
// The frontmatter `date` is preserved in both createdAt and publishedAt even
// though the rows are drafts: publishedAt on a draft is inert (the map
// generator filters on status, so nothing about it is public), and
// server/routers/blog.ts's publish only stamps publishedAt when it is still
// null — so publishing one of these later keeps the day it was actually
// written instead of silently redating it to today.
//
// Re-runnable: a slug that already exists in the table is reported and
// skipped, never overwritten. Panel edits can't be clobbered by running this
// twice.
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { slugify } from "../shared/blog.ts";
import { posts } from "../server/schema.ts";

const CONTENT_DIR = path.resolve(import.meta.dirname, "..", "content", "blog");
const DRY_RUN = process.argv.includes("--dry-run");

interface ParsedPost {
  file: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  content: string;
  date: Date | null;
}

// Deliberately not a YAML dependency: the frontmatter in these files is a
// flat list of `key: "value"` lines, and this script is deleted-adjacent
// (it exists to be run once). Anything it can't parse is reported loudly
// rather than guessed at.
function parseFrontmatter(raw: string, file: string): { fields: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: no --- frontmatter block at the top of the file`);

  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) throw new Error(`${file}: can't parse frontmatter line: ${line}`);
    let value = kv[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fields[kv[1]] = value;
  }
  return { fields, body: match[2].trim() };
}

function parse(file: string): ParsedPost {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
  const { fields, body } = parseFrontmatter(raw, file);

  if (!fields.title) throw new Error(`${file}: frontmatter has no title`);
  if (!body) throw new Error(`${file}: no body below the frontmatter`);

  // MDX allowed JSX and import/export; the new renderer is plain markdown
  // (client/src/lib/markdown.tsx) and silently drops HTML/JSX, so anything
  // that looks like it would disappear gets flagged before it does.
  const mdxIsms = [
    { pattern: /^\s*(import|export)\s/m, label: "an import/export statement" },
    { pattern: /<[A-Z][A-Za-z0-9]*[\s/>]/, label: "a JSX component tag" },
    { pattern: /\{[^}\n]*\}/, label: "a { } expression" },
  ];
  for (const { pattern, label } of mdxIsms) {
    if (pattern.test(body)) {
      console.warn(`[migrate-blog] WARNING ${file}: body contains ${label} — MDX-only syntax that plain markdown will not render.`);
    }
  }

  const date = fields.date ? new Date(fields.date) : null;
  if (fields.date && (!date || Number.isNaN(date.getTime()))) {
    throw new Error(`${file}: unparseable date "${fields.date}"`);
  }

  return {
    file,
    slug: fields.slug || slugify(fields.title),
    title: fields.title,
    excerpt: fields.description ?? "",
    category: fields.category ?? "",
    content: body,
    date: date && !Number.isNaN(date.getTime()) ? date : null,
  };
}

async function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log(`[migrate-blog] nothing to do: ${CONTENT_DIR} doesn't exist (already migrated and removed?)`);
    return;
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  if (files.length === 0) {
    console.log(`[migrate-blog] nothing to do: no .mdx files in ${CONTENT_DIR}`);
    return;
  }

  const parsed = files.map(parse);

  const duplicates = parsed.map((p) => p.slug).filter((slug, i, all) => all.indexOf(slug) !== i);
  if (duplicates.length > 0) {
    throw new Error(`Two files resolve to the same slug: ${[...new Set(duplicates)].join(", ")}`);
  }

  console.log(`[migrate-blog] ${parsed.length} file(s) in ${CONTENT_DIR}`);
  for (const post of parsed) {
    console.log(
      `[migrate-blog]   ${post.file}\n` +
        `                 slug:     ${post.slug}\n` +
        `                 title:    ${post.title}\n` +
        `                 category: ${post.category || "(none)"}\n` +
        `                 date:     ${post.date ? post.date.toISOString().slice(0, 10) : "(none)"}\n` +
        `                 body:     ${post.content.length} chars\n` +
        `                 -> lang 'es', status 'draft'`
    );
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    // A dry run is still worth something without a database: it parses every
    // file and shows exactly what would be written. It just can't tell you
    // which slugs are already there.
    if (DRY_RUN) {
      console.log("[migrate-blog] --dry-run without DATABASE_URL: parsed the files above, checked nothing against the database.");
      return;
    }
    throw new Error("DATABASE_URL is not set — nothing to migrate into.");
  }

  const connection = await mysql.createConnection(databaseUrl);
  try {
    const db = drizzle(connection, { schema: { posts }, mode: "default" });

    const existing = await db
      .select({ slug: posts.slug })
      .from(posts)
      .where(inArray(posts.slug, parsed.map((p) => p.slug)));
    const existingSlugs = new Set(existing.map((row) => row.slug));

    const toInsert = parsed.filter((p) => !existingSlugs.has(p.slug));
    for (const slug of existingSlugs) {
      console.log(`[migrate-blog] SKIP ${slug}: already in the posts table, left untouched`);
    }

    if (toInsert.length === 0) {
      console.log("[migrate-blog] nothing left to insert.");
      return;
    }

    if (DRY_RUN) {
      console.log(`[migrate-blog] --dry-run: would insert ${toInsert.length} row(s). Nothing was written.`);
      return;
    }

    await db.insert(posts).values(
      toInsert.map((post) => ({
        id: randomUUID(),
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt || null,
        content: post.content,
        category: post.category || null,
        coverSlot: null,
        status: "draft",
        lang: "es",
        publishedAt: post.date,
        createdAt: post.date ?? new Date(),
        // No author: this script runs outside any admin session, and
        // guessing a user id would put a name on writing it didn't do.
        authorId: null,
        metaTitle: null,
        metaDescription: null,
      }))
    );

    console.log(`[migrate-blog] inserted ${toInsert.length} row(s) as drafts.`);
    console.log("[migrate-blog] They are NOT public: only status = 'published' rows reach the static build.");
    console.log("[migrate-blog] Review them at /admin/blog.");
  } finally {
    await connection.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error(`[migrate-blog] FAILED: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
