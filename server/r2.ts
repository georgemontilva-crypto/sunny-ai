// Lazy R2 client, same pattern as db.ts: nothing runs at import time, so a
// missing credential never breaks the static build.
import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null | undefined;

export function getR2Client(): S3Client | null {
  if (client !== undefined) return client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    client = null;
    return client;
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

export function getR2Bucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not set");
  return bucket;
}

// R2 buckets need either a custom domain or the r2.dev public URL enabled
// to be reachable over plain HTTP — this is that base.
export function r2PublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) throw new Error("R2_PUBLIC_URL is not set");
  return `${base.replace(/\/$/, "")}/${key}`;
}
