// Generates the renditions a slot declares from one uploaded source image.
// Used by media.confirmUpload (Fase 5 live upload flow). The migration
// script does NOT use this — it uploads the pre-made base/2x/mobile files
// that already exist in client/public as-is, rather than re-deriving them.
import { createHash } from "node:crypto";
import sharp from "sharp";
import type { MediaSlotDef, VariantName, VariantSpec } from "./mediaCatalog.ts";

export interface GeneratedVariant {
  key: string;
  width: number;
  height: number;
  bytes: number;
  hash: string;
  buffer: Buffer;
}

export type GeneratedVariants = Partial<Record<VariantName, GeneratedVariant>>;

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

// Never upscale — a declared variant is skipped (not generated) when the
// source is smaller than its target width; inflating pixels adds weight,
// not detail. SVGs pass through untouched, there's nothing to resize.
export async function generateVariants(
  slotDef: MediaSlotDef,
  sourceBuffer: Buffer,
  sourceMimeType: string
): Promise<{ variants: GeneratedVariants; skipped: VariantName[] }> {
  if (sourceMimeType === "image/svg+xml") {
    const hash = sha256(sourceBuffer);
    return {
      variants: {
        base: {
          key: `media/${slotDef.slot}/base.svg`,
          width: 0,
          height: 0,
          bytes: sourceBuffer.length,
          hash,
          buffer: sourceBuffer,
        },
      },
      skipped: [],
    };
  }

  const sourceWidth = (await sharp(sourceBuffer).metadata()).width ?? 0;
  const variants: GeneratedVariants = {};
  const skipped: VariantName[] = [];

  for (const [name, spec] of Object.entries(slotDef.variants) as [VariantName, VariantSpec][]) {
    if (spec.width && sourceWidth < spec.width) {
      skipped.push(name);
      continue;
    }

    const pipeline = spec.height
      ? sharp(sourceBuffer).resize(spec.width, spec.height, { fit: "cover", position: "centre" })
      : spec.width
        ? sharp(sourceBuffer).resize({ width: spec.width })
        : sharp(sourceBuffer);

    const buffer = await pipeline.webp({ quality: 82 }).toBuffer();
    const meta = await sharp(buffer).metadata();
    variants[name] = {
      key: `media/${slotDef.slot}/${name}.webp`,
      width: meta.width ?? spec.width ?? sourceWidth,
      height: meta.height ?? spec.height ?? 0,
      bytes: buffer.length,
      hash: sha256(buffer),
      buffer,
    };
  }

  return { variants, skipped };
}
