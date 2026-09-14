import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, like, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { PENDING_IMAGE_TOKEN_RE, POST_LANGS } from "../../shared/blog.ts";
import { writeAudit } from "../auditLog.ts";
import {
  BODY_IMAGE_MIME_TYPES,
  COVER_MIME_TYPES,
  deleteUnreferenced,
  scheduleImageSweep,
  storeBodyImages,
  storeCover,
  withPostLock,
  type StoredCover,
} from "../blogImages.ts";
import type { Db } from "../db.ts";
import { tryR2PublicUrl } from "../r2.ts";
import { getPublishStatus, scheduleRepublish } from "../republish.ts";
import { posts } from "../schema.ts";
import { adminProcedure, router } from "../trpc.ts";
import { createPresignedUpload, deleteObjectsQuietly, tempKeySchema } from "../uploads.ts";

// Lowercase words joined by single hyphens. Enforced here and not only in
// the panel because the slug becomes a *path on disk*:
// scripts/prerender.mjs writes dist/blog/<slug>/index.html, so a slug
// containing "/" or ".." would be a directory traversal with a database row
// as its payload. This pattern makes that unrepresentable.
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(191)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

// "" is a real, savable value for every optional field — it means "not set"
// and the public page falls back (meta title derived from the title, and so
// on). Stored as NULL so the column has one representation of empty.
const optionalText = (max: number) => z.string().trim().max(max);

// What this save does to the cover. "keep" still saves the alt text;
// "replace" names a file the editor uploaded to a temp key moments ago, as
// the first step of this same save — see requestImageUpload below.
const coverActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("keep") }),
  z.object({ action: z.literal("remove") }),
  z.object({ action: z.literal("replace"), tempKey: tempKeySchema }),
]);

const postInput = z.object({
  title: z.string().trim().min(1, "A title is required").max(300),
  slug: slugSchema,
  excerpt: optionalText(500),
  content: z.string().max(200_000),
  category: optionalText(80),
  cover: coverActionSchema,
  coverAlt: optionalText(300),
  // Body images inserted since the last save, referenced in `content` as
  // upload:<token> until this save stores them and swaps in their URLs.
  images: z
    .array(z.object({ token: z.string().regex(PENDING_IMAGE_TOKEN_RE), tempKey: tempKeySchema }))
    .max(20, "Save in smaller batches — at most 20 new images at a time"),
  lang: z.enum(POST_LANGS),
  metaTitle: optionalText(300),
  metaDescription: optionalText(500),
});

type PostInput = z.infer<typeof postInput>;
type PostRow = typeof posts.$inferSelect;

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

function columnsFromInput(input: PostInput) {
  return {
    title: input.title.trim(),
    slug: input.slug,
    excerpt: emptyToNull(input.excerpt),
    // Not trimmed to empty-as-null: content is NOT NULL, and leading/
    // trailing blank lines in markdown are the author's to keep.
    content: input.content,
    category: emptyToNull(input.category),
    lang: input.lang,
    metaTitle: emptyToNull(input.metaTitle),
    metaDescription: emptyToNull(input.metaDescription),
  };
}

const NO_COVER = { coverKey: null, cover2xKey: null, coverWidth: null, coverHeight: null, coverAlt: null };

function coverColumns(input: PostInput, existing: PostRow | undefined, stored: StoredCover | null) {
  if (stored) return { ...stored, coverAlt: emptyToNull(input.coverAlt) };
  if (input.cover.action === "remove" || !existing?.coverKey) return NO_COVER;
  return { coverAlt: emptyToNull(input.coverAlt) };
}

// The editor shows the cover straight from R2 rather than from the static
// build, for the same reason the media list does (withResolvedUrls in
// media.ts): the panel is live. No cache-buster needed — a new cover is a
// new key.
function withCoverUrl(row: PostRow) {
  return { ...row, coverUrl: row.coverKey ? tryR2PublicUrl(row.coverKey) : null };
}

// Turns this save's uploads — a new cover, new body images — into files
// under blog/<postId>/ BEFORE the row is written, so the row can never
// point at a file that isn't there yet. The temp uploads are deleted
// whatever happens; on failure, so is anything this save already wrote.
async function storeUploads(db: Db, postId: string, input: PostInput) {
  const writtenKeys: string[] = [];
  try {
    const cover: StoredCover | null =
      input.cover.action === "replace" ? await storeCover(postId, input.cover.tempKey, writtenKeys) : null;
    const body = await storeBodyImages(postId, input.images, input.content, writtenKeys);
    return { cover, content: body.content, writtenKeys, bodyImages: body.stored };
  } catch (err) {
    await deleteUnreferenced(db, writtenKeys);
    throw err;
  } finally {
    await deleteObjectsQuietly([
      ...(input.cover.action === "replace" ? [input.cover.tempKey] : []),
      ...input.images.map((image) => image.tempKey),
    ]);
  }
}

// MySQL surfaces a unique-key violation as ER_DUP_ENTRY. Translating it here
// turns "Internal server error" into a message the editor can put next to
// the slug field.
function rethrowDuplicateSlug(err: unknown): never {
  const code = (err as { code?: string })?.code;
  if (code === "ER_DUP_ENTRY") {
    throw new TRPCError({ code: "CONFLICT", message: "Another post already uses that slug" });
  }
  throw err;
}

// Checked before the write so the conflict message names the field, rather
// than relying on the driver error alone (which can't tell a slug collision
// from any other unique key) — and before any image is processed, so a
// clash doesn't cost a round of uploads that are then thrown away.
async function assertSlugAvailable(db: Db, slug: string, exceptId?: string) {
  const [clash] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(exceptId ? and(eq(posts.slug, slug), ne(posts.id, exceptId)) : eq(posts.slug, slug));
  if (clash) throw new TRPCError({ code: "CONFLICT", message: "Another post already uses that slug" });
}

export const blogRouter = router({
  // Same global republish state the media page polls — publishing an
  // article and replacing an image go through the identical pipeline, so
  // there is only ever one status to report.
  publishStatus: adminProcedure.query(() => getPublishStatus()),

  // The list view never needs the body, and some of these are long — the
  // column is deliberately absent from the projection rather than fetched
  // and thrown away.
  list: adminProcedure
    .input(
      z
        .object({
          status: z.enum(["draft", "published"]).optional(),
          search: z.string().trim().max(200).optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const conditions = [];
      if (input?.status) conditions.push(eq(posts.status, input.status));
      if (input?.search) {
        // Title-only, as specified. LIKE with the wildcards on both sides
        // can't use the index, but this table is small by nature (articles,
        // not events) and the alternative is a FULLTEXT index for a panel
        // search box.
        const escaped = input.search.replace(/[\\%_]/g, (c) => `\\${c}`);
        conditions.push(like(posts.title, `%${escaped}%`));
      }

      const query = ctx.db
        .select({
          id: posts.id,
          slug: posts.slug,
          title: posts.title,
          category: posts.category,
          status: posts.status,
          lang: posts.lang,
          publishedAt: posts.publishedAt,
          updatedAt: posts.updatedAt,
          createdAt: posts.createdAt,
        })
        .from(posts);

      // Drafts have no publishedAt, so ordering by it alone would bury every
      // unpublished post at one end of the list regardless of how recently
      // it was touched. COALESCE puts each row where its most recent
      // activity is: publication date for published posts, last edit for
      // drafts.
      return (conditions.length > 0 ? query.where(and(...conditions)) : query).orderBy(
        desc(sql`COALESCE(${posts.publishedAt}, ${posts.updatedAt})`)
      );
    }),

  get: adminProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const [row] = await ctx.db.select().from(posts).where(eq(posts.id, input.id));
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    return withCoverUrl(row);
  }),

  // First half of a blog image upload: a presigned URL the editor PUTs the
  // file to, directly from the browser. The editor only asks for one while
  // saving — never when a file is merely picked — so a post that's
  // abandoned leaves nothing in R2. The file is processed by create/update,
  // as part of the save it belongs to, not here.
  requestImageUpload: adminProcedure
    .input(
      z.object({
        purpose: z.enum(["cover", "body"]),
        mimeType: z.string(),
        bytes: z.number().int().positive(),
      })
    )
    .mutation(({ input }) =>
      createPresignedUpload(input, input.purpose === "cover" ? COVER_MIME_TYPES : BODY_IMAGE_MIME_TYPES)
    ),

  // Always creates a draft. There is no "create and publish in one step" on
  // purpose: publishing is the thing that touches the live site, so it stays
  // an explicit second action with its own audit entry.
  create: adminProcedure.input(postInput).mutation(async ({ ctx, input }) => {
    const id = randomUUID();
    await assertSlugAvailable(ctx.db, input.slug);
    const stored = await storeUploads(ctx.db, id, input);

    try {
      await ctx.db.insert(posts).values({
        id,
        ...columnsFromInput(input),
        content: stored.content,
        ...coverColumns(input, undefined, stored.cover),
        status: "draft",
        publishedAt: null,
        authorId: ctx.session.userId,
      });
    } catch (err) {
      await deleteUnreferenced(ctx.db, stored.writtenKeys);
      rethrowDuplicateSlug(err);
    }

    await writeAudit(ctx.db, {
      userId: ctx.session.userId,
      action: "blog.create",
      entity: id,
      detail: { slug: input.slug, title: input.title, cover: Boolean(stored.cover), bodyImages: stored.bodyImages },
    });

    const [row] = await ctx.db.select().from(posts).where(eq(posts.id, id));
    return withCoverUrl(row);
  }),

  update: adminProcedure
    .input(postInput.extend({ id: z.uuid() }))
    .mutation(({ ctx, input }) =>
      withPostLock(input.id, async () => {
        const [existing] = await ctx.db.select().from(posts).where(eq(posts.id, input.id));
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        await assertSlugAvailable(ctx.db, input.slug, input.id);

        const stored = await storeUploads(ctx.db, input.id, input);
        try {
          await ctx.db
            .update(posts)
            .set({
              ...columnsFromInput(input),
              content: stored.content,
              ...coverColumns(input, existing, stored.cover),
            })
            .where(eq(posts.id, input.id));
        } catch (err) {
          await deleteUnreferenced(ctx.db, stored.writtenKeys);
          rethrowDuplicateSlug(err);
        }

        await writeAudit(ctx.db, {
          userId: ctx.session.userId,
          action: "blog.update",
          entity: input.id,
          detail: { slug: input.slug, status: existing.status, cover: input.cover.action, bodyImages: stored.bodyImages },
        });

        // Saving a DRAFT changes nothing public — no republish, per the
        // panel's own promise. Saving a post that is already published does
        // change the live article, so it republishes: the alternative is a
        // live page that silently disagrees with what the editor shows.
        const published = existing.status === "published";

        // Every save cleans up what the post no longer uses: the cover this
        // save replaced or removed, and body images taken out of the text.
        // The previous cover's keys are passed explicitly because a cover
        // migrated from the old blog-cover-* slots lives outside the post's
        // own prefix. For a published post this waits for the republish.
        scheduleImageSweep(input.id, [existing.coverKey, existing.cover2xKey], { afterPublish: published });
        if (published) scheduleRepublish();

        const [row] = await ctx.db.select().from(posts).where(eq(posts.id, input.id));
        return withCoverUrl(row);
      })
    ),

  publish: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select().from(posts).where(eq(posts.id, input.id));
    if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
    if (!existing.content.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Add some content before publishing" });
    }

    // Only stamped the first time. Re-publishing something that was taken
    // down keeps its original date instead of quietly redating the article,
    // and it's what lets scripts/migrate-blog-to-db.ts carry the old MDX
    // frontmatter dates across.
    const publishedAt = existing.publishedAt ?? new Date();
    await ctx.db.update(posts).set({ status: "published", publishedAt }).where(eq(posts.id, input.id));

    await writeAudit(ctx.db, {
      userId: ctx.session.userId,
      action: "blog.publish",
      entity: input.id,
      detail: { slug: existing.slug },
    });

    scheduleRepublish();

    const [row] = await ctx.db.select().from(posts).where(eq(posts.id, input.id));
    return row;
  }),

  // Back to draft: the row keeps its publishedAt (see publish above), it
  // just stops being written into blog-map.json, so the republish below
  // removes the article's card, its prerendered page and its sitemap entry.
  unpublish: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select().from(posts).where(eq(posts.id, input.id));
    if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

    await ctx.db.update(posts).set({ status: "draft" }).where(eq(posts.id, input.id));

    await writeAudit(ctx.db, {
      userId: ctx.session.userId,
      action: "blog.unpublish",
      entity: input.id,
      detail: { slug: existing.slug },
    });

    scheduleRepublish();

    const [row] = await ctx.db.select().from(posts).where(eq(posts.id, input.id));
    return row;
  }),

  delete: adminProcedure.input(z.object({ id: z.uuid() })).mutation(({ ctx, input }) =>
    withPostLock(input.id, async () => {
      const [existing] = await ctx.db.select().from(posts).where(eq(posts.id, input.id));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.delete(posts).where(eq(posts.id, input.id));

      await writeAudit(ctx.db, {
        userId: ctx.session.userId,
        action: "blog.delete",
        entity: input.id,
        // The row is gone, so the audit entry is the only remaining record of
        // what it was — keep enough of it to recognise.
        detail: { slug: existing.slug, title: existing.title, status: existing.status },
      });

      // With the row gone nothing references its files any more, so the
      // cleanup removes all of blog/<postId>/ (keeping only a file another
      // post's body happens to reuse). Deleting a draft removes nothing
      // public, so that happens now; a published article's page has to come
      // down first.
      const published = existing.status === "published";
      scheduleImageSweep(input.id, [existing.coverKey, existing.cover2xKey], { afterPublish: published });
      if (published) scheduleRepublish();

      return { id: input.id };
    })
  ),
});
