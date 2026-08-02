// client/src/generated/media-map.json is written by
// scripts/generate-media-map.ts before every build (and committed with a
// client/public fallback so `pnpm dev` works without running it first).
// Components always go through here — never a literal /slot.webp path.
import mediaMap from "../generated/media-map.json";

type VariantName = "base" | "2x" | "mobile";
type SlotEntry = Partial<Record<VariantName, string>>;

const map = mediaMap as Record<string, SlotEntry>;

export function getSlotUrl(slot: string, variant: VariantName = "base"): string | undefined {
  const url = map[slot]?.[variant];
  if (url) return url;
  return variant === "base" ? `/${slot}.webp` : undefined;
}
