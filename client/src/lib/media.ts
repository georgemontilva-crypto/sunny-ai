// client/src/generated/media-map.json is written by
// scripts/generate-media-map.ts before every build (and committed with a
// client/public fallback so `pnpm dev` works without running it first).
// Components always go through here — never a literal /slot.webp path.
import mediaMap from "../generated/media-map.json";

type VariantName = "base" | "2x" | "mobile";
type SlotEntry = Partial<Record<VariantName, string>>;

const map = mediaMap as Record<string, SlotEntry>;

// No guessed fallback here on purpose: generate-media-map.ts only ever puts
// a real entry in the map for a variant that exists on disk (client/public)
// or in the DB, so a missing entry means the slot is genuinely empty — a
// component can render a placeholder instead of a broken <img>.
export function getSlotUrl(slot: string, variant: VariantName = "base"): string | undefined {
  return map[slot]?.[variant];
}
