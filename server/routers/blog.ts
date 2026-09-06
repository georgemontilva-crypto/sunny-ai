import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, like, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { POST_LANGS } from "../../shared/blog.ts";
import { writeAudit } from "../auditLog.ts";
import { isBlogCoverSlot } from "../mediaCatalog.ts";
import { getPublishStatus, scheduleRepublish } from "../republish.ts";
import { posts } from "../schema.ts";
import { adminProcedure, router } from "../trpc.ts";

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
// and the public page falls back (no cover image, meta title derived from
// the title). Stored as NULL so the column has one representation of empty.
const optionalText = (max: number) => z.string().trim().max(max);

const coverSlotSchema = z
  .string()
  .trim()
  .max(80)
  .refine((slot) => slot === "" || isBlogCoverSlot(slot), "Unknown cover slot");

const postInput = z.object({
  title: z.string().trim().min(1, "A title is required").max(300),
  slug: slugSchema,
  excerpt: optionalText(500),
  content: z.string().max(200_000),
  category: optionalText(80),
  coverSlot: coverSlotSchema,
  lang: z.enum(POST_LANGS),
  metaTitle: optionalText(300),
  metaDescription: optionalText(500),
});

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

function columnsFromInput(input: z.infer<typeof postInput>) {
  return {
    title: input.title.trim(),
    slug: input.slug,
    excerpt: emptyToNull(input.excerpt),
    // Not trimmed to empty-as-null: content is NOT NULL, and leading/
    // trailing blank lines in markdown are the author's to keep.
    content: input.content,
    category: emptyToNull(input.category),
    coverSlot: emptyToNull(input.coverSlot),
    lang: input.lang,
    metaTitle: emptyToNull(input.metaTitle),
    metaDescription: emptyToNull(input.metaDescription),
  };
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
          coverSlot: posts.coverSlot,
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
    return row;
  }),

  // Always creates a draft. There is no "create and publish in one step" on
  // purpose: publishing is the thing that touches the live site, so it stays
  // an explicit second action with its own audit entry.
  create: adminProcedure.input(postInput).mutation(async ({ ctx, input }) => {
    const id = randomUUID();
    try {
      await ctx.db.insert(posts).values({
        id,
        ...columnsFromInput(input),
        status: "draft",
        publishedAt: null,
        authorId: ctx.session.userId,
      });
    } catch (err) {
      rethrowDuplicateSlug(err);
    }

    await writeAudit(ctx.db, {
      userId: ctx.session.userId,
      action: "blog.create",
      entity: id,
      detail: { slug: input.slug, title: input.title },
    });

    const [row] = await ctx.db.select().from(posts).where(eq(posts.id, id));
    return row;
  }),

  update: adminProcedure
    .input(postInput.extend({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(posts).where(eq(posts.id, input.id));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      // Checked before the write so the conflict message names the field,
      // rather than relying on the driver error alone (which can't tell a
      // slug collision from any other unique key).
      const [clash] = await ctx.db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.slug, input.slug), ne(posts.id, input.id)));
      if (clash) throw new TRPCError({ code: "CONFLICT", message: "Another post already uses that slug" });

      try {
        await ctx.db.update(posts).set(columnsFromInput(input)).where(eq(posts.id, input.id));
      } catch (err) {
        rethrowDuplicateSlug(err);
      }

      await writeAudit(ctx.db, {
        userId: ctx.session.userId,
        action: "blog.update",
        entity: input.id,
        detail: { slug: input.slug, status: existing.status },
      });

      // Saving a DRAFT changes nothing public — no republish, per the
      // panel's own promise. Saving a post that is already published does
      // change the live article, so it republishes: the alternative is a
      // live page that silently disagrees with what the editor shows.
      if (existing.status === "published") scheduleRepublish();

      const [row] = await ctx.db.select().from(posts).where(eq(posts.id, input.id));
      return row;
    }),

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

  delete: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
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

    // Deleting a draft removes nothing public; deleting a published article
    // has to take its page down.
    if (existing.status === "published") scheduleRepublish();

    return { id: input.id };
  }),
});
