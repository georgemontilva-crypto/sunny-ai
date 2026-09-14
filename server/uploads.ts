// The upload pipeline /admin/media and /admin/blog share. The browser PUTs
// the file straight to R2 under a throwaway uploads/tmp/ key through a
// presigned URL, so the bytes never pass through this process on the way
// in; the confirm step then reads it back, checks the real bytes (never the
// declared type), and writes the renditions server/mediaVariants.ts makes.
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES, describeMimeTypes, sniffMimeType } from "./mediaValidation.ts";
import type { GeneratedVariants } from "./mediaVariants.ts";
import { getR2Bucket, getR2Client } from "./r2.ts";

// The confirm step deletes the temp object once it's read it, so a tempKey
// is a delete target as much as a read one. Only keys this module handed
// out are accepted — otherwise any key in the bucket, a live image
// included, could be passed in and removed.
export const tempKeySchema = z.string().regex(/^uploads\/tmp\/[0-9a-f-]{36}$/, "Invalid upload key");

function requireR2() {
  const r2 = getR2Client();
  if (!r2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "R2 is not configured" });
  return { r2, bucket: getR2Bucket() };
}

async function streamToBuffer(stream: unknown): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function createPresignedUpload(
  input: { mimeType: string; bytes: number },
  allowed: readonly string[] = ALLOWED_MIME_TYPES
): Promise<{ uploadUrl: string; tempKey: string }> {
  if (!allowed.includes(input.mimeType)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Only ${describeMimeTypes(allowed)} are allowed` });
  }
  if (input.bytes > MAX_UPLOAD_BYTES) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "File is larger than 5 MB" });
  }

  const { r2, bucket } = requireR2();
  const tempKey = `uploads/tmp/${randomUUID()}`;
  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: bucket, Key: tempKey, ContentType: input.mimeType }),
    { expiresIn: 300 }
  );
  return { uploadUrl, tempKey };
}

export async function readTempUpload(
  tempKey: string,
  allowed: readonly string[] = ALLOWED_MIME_TYPES
): Promise<{ buffer: Buffer; mimeType: string }> {
  const { r2, bucket } = requireR2();
  const obj = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: tempKey })).catch(() => null);
  if (!obj?.Body) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload not found — please try again" });

  const buffer = await streamToBuffer(obj.Body);
  const mimeType = sniffMimeType(buffer);
  if (!mimeType || !allowed.includes(mimeType)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `That file doesn't look like a ${describeMimeTypes(allowed)}` });
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "File is larger than 5 MB" });
  }
  return { buffer, mimeType };
}

// Writes each rendition, pushing its key onto `written` as it lands, so a
// caller that has to roll back knows exactly what got written before a
// failure. No rollback of its own on purpose: a media slot's keys are fixed
// (media/<slot>/base.webp), so a "written" key there is the live image,
// just overwritten — deleting it would take the slot down, not undo
// anything. The blog's rollback (routers/blog.ts) only deletes keys no post
// references.
export async function putVariants(
  variants: GeneratedVariants,
  mimeType: string,
  options: { cacheControl?: string; written?: string[] } = {}
): Promise<void> {
  const { r2, bucket } = requireR2();
  for (const variant of Object.values(variants)) {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: variant.key,
        Body: variant.buffer,
        ContentType: mimeType === "image/svg+xml" ? "image/svg+xml" : "image/webp",
        ...(options.cacheControl ? { CacheControl: options.cacheControl } : {}),
      })
    );
    options.written?.push(variant.key);
  }
}

// Best effort, one DeleteObject per key (the call the media flow has always
// used against this bucket). A failure is logged and reported back, never
// thrown: callers run this as cleanup after the thing that mattered already
// succeeded. Returns the keys that could NOT be deleted.
export async function deleteObjectsQuietly(keys: string[]): Promise<string[]> {
  const unique = [...new Set(keys.filter(Boolean))];
  if (unique.length === 0) return [];
  const r2 = getR2Client();
  if (!r2) return unique;
  const bucket = getR2Bucket();

  const results = await Promise.allSettled(
    unique.map((key) => r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })))
  );
  const failed = unique.filter((_, i) => results[i].status === "rejected");
  if (failed.length > 0) console.error(`[uploads] could not delete ${failed.length} object(s): ${failed.join(", ")}`);
  return failed;
}

export async function listObjectKeys(prefix: string): Promise<string[]> {
  const { r2, bucket } = requireR2();
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const page = await r2.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken })
    );
    for (const obj of page.Contents ?? []) if (obj.Key) keys.push(obj.Key);
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}
