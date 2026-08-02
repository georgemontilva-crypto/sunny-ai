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

export interface BaseUndersized {
  targetWidth: number;
  actualWidth: number;
}

export interface GenerateVariantsResult {
  variants: GeneratedVariants;
  // Non-base variants (2x, mobile) skipped because the source was smaller
  // than their target — those genuinely have nothing to show.
  skipped: VariantName[];
  // base is NEVER skipped (a slot with no base breaks the page it's used
  // on) — this just flags that it was saved at native size instead of the
  // declared target, so the UI can warn without leaving the slot empty.
  baseUndersized: BaseUndersized | null;
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

// Never upscale — a non-base variant is skipped (not generated) when the
// source is smaller than its target width; inflating pixels adds weight,
// not detail. base is always generated, resized down to its target only if
// the source is large enough, otherwise saved at native size. SVGs pass
// through untouched, there's nothing to resize.
export async function generateVariants(
  slotDef: MediaSlotDef,
  sourceBuffer: Buffer,
  sourceMimeType: string
): Promise<GenerateVariantsResult> {
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
      baseUndersized: null,
    };
  }

  const sourceWidth = (await sharp(sourceBuffer).metadata()).width ?? 0;
  const variants: GeneratedVariants = {};
  const skipped: VariantName[] = [];
  let baseUndersized: BaseUndersized | null = null;

  for (const [name, spec] of Object.entries(slotDef.variants) as [VariantName, VariantSpec][]) {
    const isBase = name === "base";
    const tooSmall = spec.width !== undefined && sourceWidth < spec.width;

    if (tooSmall && !isBase) {
      skipped.push(name);
      continue;
    }
    if (tooSmall && isBase) {
      baseUndersized = { targetWidth: spec.width!, actualWidth: sourceWidth };
    }

    // Resize only when there's a target and the source actually meets it —
    // an undersized base falls through to the plain `sharp(sourceBuffer)`
    // branch below, saved at its native size instead of upscaled.
    const canResizeToTarget = spec.width !== undefined && !tooSmall;
    const pipeline =
      canResizeToTarget && spec.height
        ? sharp(sourceBuffer).resize(spec.width, spec.height, { fit: "cover", position: "centre" })
        : canResizeToTarget
          ? sharp(sourceBuffer).resize({ width: spec.width })
          : sharp(sourceBuffer);

    const buffer = await pipeline.webp({ quality: 82 }).toBuffer();
    const meta = await sharp(buffer).metadata();
    variants[name] = {
      key: `media/${slotDef.slot}/${name}.webp`,
      width: meta.width ?? sourceWidth,
      height: meta.height ?? 0,
      bytes: buffer.length,
      hash: sha256(buffer),
      buffer,
    };
  }

  return { variants, skipped, baseUndersized };
}
