// Single source of truth for which slots exist and what renditions each
// one needs. Code (components, the media router, migration/seed scripts)
// always looks a slot up here — never hardcodes a filename.
export type VariantName = "base" | "2x" | "mobile";

export interface VariantSpec {
  width?: number;
  // Only "mobile" crops to a fixed height; base/2x just scale by width,
  // preserving aspect ratio.
  height?: number;
}

export interface MediaSlotDef {
  slot: string;
  label: string;
  variants: Partial<Record<VariantName, VariantSpec>>;
}

export const MEDIA_SLOTS: MediaSlotDef[] = [
  {
    slot: "hero-bg",
    label: "Hero background",
    variants: { base: { width: 1600 }, "2x": { width: 2560 }, mobile: { width: 900, height: 900 } },
  },
  {
    slot: "hero-sunny",
    label: "Hero — Sunny portrait",
    variants: { base: { width: 1200 }, "2x": { width: 2400 } },
  },
  { slot: "card-sleep-quality", label: "Question card — Sleep quality", variants: { base: {} } },
  { slot: "card-body-composition", label: "Question card — Body composition", variants: { base: {} } },
  { slot: "card-tissue-repair", label: "Question card — Tissue repair", variants: { base: {} } },
  {
    slot: "card-cognitive-focus",
    label: "Question card — Cognitive focus",
    variants: { base: { width: 800 }, "2x": { width: 1600 } },
  },
  {
    slot: "card-hormonal-balance",
    label: "Question card — Hormonal balance",
    variants: { base: { width: 800 }, "2x": { width: 1600 } },
  },
  {
    slot: "card-skin-hair",
    label: "Question card — Skin & hair",
    variants: { base: { width: 800 }, "2x": { width: 1600 } },
  },
  { slot: "how-goals", label: "How it works — step 1", variants: { base: {} } },
  { slot: "how-analysis", label: "How it works — step 2", variants: { base: {} } },
  { slot: "how-guidance", label: "How it works — step 3", variants: { base: {} } },
  {
    slot: "how-explore",
    label: "How it works — step 4",
    variants: { base: { width: 500 }, "2x": { width: 1000 } },
  },
  { slot: "compound-bpc-157", label: "Compound — BPC-157", variants: { base: {} } },
  { slot: "compound-tb-500", label: "Compound — TB-500", variants: { base: {} } },
  { slot: "compound-ghk-cu", label: "Compound — GHK-Cu", variants: { base: {} } },
  { slot: "compound-mots-c", label: "Compound — MOTS-c", variants: { base: {} } },
  { slot: "compound-semax", label: "Compound — Semax", variants: { base: {} } },
  { slot: "goal-recovery", label: "Goal — Recovery & healing", variants: { base: {} } },
  { slot: "goal-fat-loss", label: "Goal — Fat loss & metabolic", variants: { base: {} } },
  { slot: "goal-cognition", label: "Goal — Cognition & focus", variants: { base: {} } },
  { slot: "goal-longevity", label: "Goal — Longevity & anti-aging", variants: { base: {} } },
  { slot: "goal-performance", label: "Goal — Performance & growth", variants: { base: {} } },
  { slot: "goal-sleep", label: "Goal — Sleep & hormones", variants: { base: {} } },
  { slot: "logo", label: "Logo", variants: { base: {} } },
  { slot: "favicon-svg", label: "Favicon (SVG)", variants: { base: {} } },
  { slot: "favicon-png", label: "Favicon (PNG fallback)", variants: { base: {} } },
];

const SLOT_MAP = new Map(MEDIA_SLOTS.map((def) => [def.slot, def]));

export function getSlotDef(slot: string): MediaSlotDef | undefined {
  return SLOT_MAP.get(slot);
}

export function isValidSlot(slot: string): boolean {
  return SLOT_MAP.has(slot);
}
