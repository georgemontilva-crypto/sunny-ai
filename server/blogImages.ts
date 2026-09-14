// Where a post's images live and how they get there. Everything a post
// owns sits under blog/<postId>/ in R2 — its cover, the cover's 2x, and any
// image inserted into the body — so posts never share or overwrite each
// other's files, and "delete the post's images" means "delete that prefix".
//
// Same pipeline as /admin/media (server/uploads.ts: presigned upload to a
// temp key, magic-byte check, sharp renditions), with two differences: the
// destination, and that file names carry a content hash. A replaced cover is
// therefore a new key rather than new bytes under the old one — no CDN or
// browser can keep serving the previous image, and the old file can be
// deleted on its own schedule (see sweepPostImages).
import { TRPCError } from "@trpc/server";
import { eq, like, or } from "drizzle-orm";
import { COVER_SIZE, COVER_SIZE_2X, pendingImageRef, replacePendingImageRef } from "../shared/blog.ts";
import { getDb, type Db } from "./db.ts";
import { generateVariants, type GenerateVariantsResult, type VariantSpecs } from "./mediaVariants.ts";
import { ALLOWED_MIME_TYPES, RASTER_MIME_TYPES } from "./mediaValidation.ts";
import { getR2Client, tryR2PublicUrl } from "./r2.ts";
import { runAfterPublish } from "./republish.ts";
import { posts } from "./schema.ts";
import { deleteObjectsQuietly, listObjectKeys, putVariants, readTempUpload } from "./uploads.ts";

export const COVER_MIME_TYPES = RASTER_MIME_TYPES;
export const BODY_IMAGE_MIME_TYPES = ALLOWED_MIME_TYPES;

const COVER_VARIANTS: VariantSpecs = {
  base: { ...COVER_SIZE, recommended: COVER_SIZE },
  "2x": { ...COVER_SIZE_2X, recommended: COVER_SIZE_2X },
};

// One rendition, capped at 1600px wide. The article column is under 800px,
// so that's already its 2x — and a markdown image is a single <img>, with no
// srcset to put a second rendition in.
const BODY_IMAGE_VARIANTS: VariantSpecs = {
  base: { width: 1600, recommended: { width: 1600, height: 900 } },
};

// The keys never change once written (the hash is in the name), so they can
// be cached forever.
const IMMUTABLE = "public, max-age=31536000, immutable";

export function postImagePrefix(postId: string): string {
  return `blog/${postId}/`;
}

// sharp throws on a file that passed the magic-byte check but isn't a
// decodable image (truncated, corrupt). That's the author's file, not a
// server fault, so it's reported as one.
async function render(
  specs: VariantSpecs,
  buffer: Buffer,
  mimeType: string,
  keyFor: Parameters<typeof generateVariants>[3]
): Promise<GenerateVariantsResult> {
  try {
    return await generateVariants(specs, buffer, mimeType, keyFor);
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "We couldn't read that image. Try exporting it again as JPEG, PNG or WebP.",
    });
  }
}

export interface StoredCover {
  coverKey: string;
  cover2xKey: string | null;
  coverWidth: number;
  coverHeight: number;
}

// Both store functions push every key they write onto `written` as it
// lands. Rolling those back when the save fails is the caller's job
// (storeUploads in routers/blog.ts), through deleteUnreferenced below.

export async function storeCover(postId: string, tempKey: string, written: string[]): Promise<StoredCover> {
  const { buffer, mimeType } = await readTempUpload(tempKey, COVER_MIME_TYPES);
  const { variants } = await render(COVER_VARIANTS, buffer, mimeType, (name, ext, hash) =>
    name === "base" ? `${postImagePrefix(postId)}cover-${hash}.${ext}` : `${postImagePrefix(postId)}cover-${hash}@${name}.${ext}`
  );
  await putVariants(variants, mimeType, { cacheControl: IMMUTABLE, written });
  const base = variants.base!;
  return {
    coverKey: base.key,
    cover2xKey: variants["2x"]?.key ?? null,
    coverWidth: base.width,
    coverHeight: base.height,
  };
}

// Stores each pending body image that is still referenced in `content` and
// swaps its upload:<token> reference for the stored file's public URL. One
// that was inserted and then deleted from the text before saving is skipped:
// it's never written, so it never needs cleaning up.
export async function storeBodyImages(
  postId: string,
  images: { token: string; tempKey: string }[],
  content: string,
  written: string[]
): Promise<{ content: string; stored: number }> {
  let next = content;
  let stored = 0;
  for (const { token, tempKey } of images) {
    if (!next.includes(pendingImageRef(token))) continue;
    const { buffer, mimeType } = await readTempUpload(tempKey, BODY_IMAGE_MIME_TYPES);
    const { variants } = await render(
      BODY_IMAGE_VARIANTS,
      buffer,
      mimeType,
      (_name, ext, hash) => `${postImagePrefix(postId)}img-${hash}.${ext}`
    );
    const url = tryR2PublicUrl(variants.base!.key);
    if (!url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "R2_PUBLIC_URL is not set" });
    await putVariants(variants, mimeType, { cacheControl: IMMUTABLE, written });
    next = replacePendingImageRef(next, token, url);
    stored++;
  }
  return { content: next, stored };
}

// Deletes each key that no post points at — as its cover, its cover's 2x, or
// anywhere in its body. Checked against every post, not only the one being
// cleaned up, so a body that reuses another article's image (copied
// markdown) keeps it. Also what makes rolling back a failed save safe: if a
// save re-uploads a file the post already had, the hash makes it the same
// key, and that key is still referenced, so it stays.
export async function deleteUnreferenced(db: Db | null, keys: string[]): Promise<string[]> {
  if (!db) return [];
  const unused: string[] = [];
  for (const key of new Set(keys)) {
    const escaped = key.replace(/[\\%_]/g, (c) => `\\${c}`);
    const [ref] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(or(eq(posts.coverKey, key), eq(posts.cover2xKey, key), like(posts.content, `%${escaped}%`)))
      .limit(1);
    if (!ref) unused.push(key);
  }
  const failed = await deleteObjectsQuietly(unused);
  return unused.filter((key) => !failed.includes(key));
}

// Serializes the work that reads a post's references and then acts on them
// (a save, a cleanup pass), per post. Without it, a cleanup that listed the
// prefix while a concurrent save had written a new image but not yet stored
// the row pointing at it would see that image as unreferenced and delete it.
// In-process only, like the republish single-flight.
const postLocks = new Map<string, Promise<unknown>>();

export function withPostLock<T>(postId: string, fn: () => Promise<T>): Promise<T> {
  const previous = postLocks.get(postId) ?? Promise.resolve();
  const run = previous.then(fn, fn);
  const settled = run.then(
    () => undefined,
    () => undefined
  );
  postLocks.set(postId, settled);
  void settled.then(() => {
    if (postLocks.get(postId) === settled) postLocks.delete(postId);
  });
  return run;
}

// Removes every file under the post's prefix that its current row no longer
// references — a replaced cover, a body image taken out of the text, or, when
// the row is gone, everything. `extraKeys` are candidates outside the prefix:
// a cover migrated from the old blog-cover-* slots still lives under media/.
async function sweepPostImages(postId: string, extraKeys: string[]): Promise<void> {
  const db = getDb();
  if (!db || !getR2Client()) return;
  await withPostLock(postId, async () => {
    const owned = await listObjectKeys(postImagePrefix(postId));
    const deleted = await deleteUnreferenced(db, [...owned, ...extraKeys]);
    if (deleted.length > 0) {
      console.log(`[blog-images] post ${postId}: deleted ${deleted.length} unused file(s): ${deleted.join(", ")}`);
    }
  });
}

const pendingSweeps = new Map<string, Set<string>>();

async function drainPendingSweeps(): Promise<void> {
  const batch = [...pendingSweeps.entries()];
  pendingSweeps.clear();
  for (const [postId, extraKeys] of batch) {
    await sweepPostImages(postId, [...extraKeys]).catch((err) =>
      console.error(`[blog-images] cleanup for post ${postId} failed —`, err)
    );
  }
}

// A draft is on no public page, so its unused files can go now. A published
// article's live HTML keeps pointing at the old files until the republish it
// just triggered has finished, so its cleanup waits for that — and, if the
// republish fails, for the next one that doesn't.
export function scheduleImageSweep(
  postId: string,
  extraKeys: (string | null | undefined)[],
  { afterPublish }: { afterPublish: boolean }
): void {
  const keys = extraKeys.filter((key): key is string => Boolean(key));
  if (!afterPublish) {
    void sweepPostImages(postId, keys).catch((err) =>
      console.error(`[blog-images] cleanup for post ${postId} failed —`, err)
    );
    return;
  }
  const pending = pendingSweeps.get(postId) ?? new Set<string>();
  for (const key of keys) pending.add(key);
  pendingSweeps.set(postId, pending);
  runAfterPublish("blog-image-sweep", drainPendingSweeps);
}
