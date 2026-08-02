// Single source of truth for which slots exist and what renditions each
// one needs. Code (components, the media router, migration/seed scripts)
// always looks a slot up here — never hardcodes a filename.
export type VariantName = "base" | "2x" | "mobile";

export interface Dimensions {
  width: number;
  height: number;
}

export interface VariantSpec {
  // Enforced resize target read by mediaVariants.ts — undefined means
  // "native, no resize, no undersized check" (e.g. compound cards: upload
  // whatever, it's used as-is). Only "mobile" crops to a fixed height;
  // base/2x scale by width alone, preserving the source's aspect ratio.
  width?: number;
  height?: number;
  // Always shown in the admin UI as upload guidance, whether or not the
  // fields above enforce anything — for slots with no enforced target this
  // is just today's asset size, a suggestion, not a requirement.
  recommended: Dimensions;
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
    variants: {
      base: { width: 1600, recommended: { width: 1600, height: 800 } },
      "2x": { width: 2560, recommended: { width: 2560, height: 1280 } },
      mobile: { width: 900, height: 900, recommended: { width: 900, height: 900 } },
    },
  },
  {
    slot: "partner-hero",
    label: "Partner page — hero",
    variants: {
      base: { width: 1200, recommended: { width: 1200, height: 750 } },
      "2x": { width: 2400, recommended: { width: 2400, height: 1500 } },
    },
  },
  {
    slot: "hero-sunny",
    label: "Hero — Sunny portrait",
    variants: {
      base: { width: 1200, recommended: { width: 1200, height: 600 } },
      "2x": { width: 2400, recommended: { width: 2400, height: 1200 } },
    },
  },
  {
    slot: "card-sleep-quality",
    label: "Question card — Sleep quality",
    variants: { base: { recommended: { width: 400, height: 160 } } },
  },
  {
    slot: "card-body-composition",
    label: "Question card — Body composition",
    variants: { base: { recommended: { width: 400, height: 160 } } },
  },
  {
    slot: "card-tissue-repair",
    label: "Question card — Tissue repair",
    variants: { base: { recommended: { width: 400, height: 160 } } },
  },
  {
    slot: "card-cognitive-focus",
    label: "Question card — Cognitive focus",
    variants: {
      base: { width: 800, recommended: { width: 800, height: 320 } },
      "2x": { width: 1600, recommended: { width: 1600, height: 640 } },
    },
  },
  {
    slot: "card-hormonal-balance",
    label: "Question card — Hormonal balance",
    variants: {
      base: { width: 800, recommended: { width: 800, height: 320 } },
      "2x": { width: 1600, recommended: { width: 1600, height: 640 } },
    },
  },
  {
    slot: "card-skin-hair",
    label: "Question card — Skin & hair",
    variants: {
      base: { width: 800, recommended: { width: 800, height: 320 } },
      "2x": { width: 1600, recommended: { width: 1600, height: 640 } },
    },
  },
  { slot: "how-goals", label: "How it works — step 1", variants: { base: { recommended: { width: 500, height: 300 } } } },
  {
    slot: "how-analysis",
    label: "How it works — step 2",
    variants: { base: { recommended: { width: 500, height: 300 } } },
  },
  {
    slot: "how-guidance",
    label: "How it works — step 3",
    variants: { base: { recommended: { width: 500, height: 300 } } },
  },
  {
    slot: "how-explore",
    label: "How it works — step 4",
    variants: {
      base: { width: 500, recommended: { width: 500, height: 300 } },
      "2x": { width: 1000, recommended: { width: 1000, height: 600 } },
    },
  },
  { slot: "compound-bpc-157", label: "Compound — BPC-157", variants: { base: { recommended: { width: 350, height: 140 } } } },
  { slot: "compound-tb-500", label: "Compound — TB-500", variants: { base: { recommended: { width: 350, height: 140 } } } },
  { slot: "compound-ghk-cu", label: "Compound — GHK-Cu", variants: { base: { recommended: { width: 350, height: 140 } } } },
  { slot: "compound-mots-c", label: "Compound — MOTS-c", variants: { base: { recommended: { width: 350, height: 140 } } } },
  { slot: "compound-semax", label: "Compound — Semax", variants: { base: { recommended: { width: 350, height: 140 } } } },
  { slot: "goal-recovery", label: "Goal — Recovery & healing", variants: { base: { recommended: { width: 400, height: 160 } } } },
  { slot: "goal-fat-loss", label: "Goal — Fat loss & metabolic", variants: { base: { recommended: { width: 400, height: 160 } } } },
  { slot: "goal-cognition", label: "Goal — Cognition & focus", variants: { base: { recommended: { width: 400, height: 160 } } } },
  {
    slot: "goal-longevity",
    label: "Goal — Longevity & anti-aging",
    variants: { base: { recommended: { width: 400, height: 160 } } },
  },
  {
    slot: "goal-performance",
    label: "Goal — Performance & growth",
    variants: { base: { recommended: { width: 400, height: 160 } } },
  },
  { slot: "goal-sleep", label: "Goal — Sleep & hormones", variants: { base: { recommended: { width: 400, height: 160 } } } },
  { slot: "logo", label: "Logo", variants: { base: { recommended: { width: 886, height: 300 } } } },
  { slot: "favicon-svg", label: "Favicon (SVG)", variants: { base: { recommended: { width: 100, height: 100 } } } },
  { slot: "favicon-png", label: "Favicon (PNG fallback)", variants: { base: { recommended: { width: 64, height: 64 } } } },
];

const SLOT_MAP = new Map(MEDIA_SLOTS.map((def) => [def.slot, def]));

export function getSlotDef(slot: string): MediaSlotDef | undefined {
  return SLOT_MAP.get(slot);
}

export function isValidSlot(slot: string): boolean {
  return SLOT_MAP.has(slot);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// "1200×600 · 2:1" — falls back to a decimal ratio when the reduced
// fraction has an ugly denominator (e.g. a logo that isn't a clean ratio).
export function formatAspectRatio(width: number, height: number): string {
  if (!width || !height) return "";
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  if (w <= 20 && h <= 20) return `${w}:${h}`;
  return `${(width / height).toFixed(2)}:1`;
}
