// The one real "compound library" this site has — client/src/components/
// landing/Compounds.tsx (Home) and the /partner catalog-data section both
// read from here, so there's exactly one place that says what's indexed.
//
// evidenceLevel isn't a new claim: each compound's own description already
// states its research stage in its own wording ("preclinical research
// explores...", "studied in animal models...") — this field just formalizes
// what was already written and reviewed, for anything that needs the label
// on its own (the /partner evidence-tag row).
export type EvidenceLevel = "preclinical" | "animal models" | "human trials";

export interface CompoundEntry {
  name: string;
  category: string;
  description: string;
  image: string;
  evidenceLevel: EvidenceLevel;
  // Short evidence-status pills shown on the featured compound card
  // (Compounds.tsx). Left empty where this hasn't been reviewed yet —
  // never inferred from evidenceLevel, which is a broader classification.
  evidenceTags?: string[];
}

export const compoundLibrary: CompoundEntry[] = [
  {
    name: "BPC-157",
    category: "Tissue Repair",
    description: "A synthetic fragment derived from a gastric protective protein. Preclinical research explores its role in tendon, ligament, and gastrointestinal tissue repair.",
    image: "compound-bpc-157",
    evidenceLevel: "preclinical",
    evidenceTags: ["Preclinical", "Animal models", "No RCTs published"],
  },
  {
    name: "TB-500",
    category: "Recovery",
    description: "A synthetic peptide modeled on a fragment of thymosin beta-4. Studied in animal models for wound healing and cellular motility in basic cell biology.",
    image: "compound-tb-500",
    evidenceLevel: "animal models",
  },
  {
    name: "GHK-Cu",
    category: "Skin Health",
    description: "A copper complex of a naturally occurring tripeptide. Much of the published research focuses on dermatology, including skin regeneration and collagen synthesis.",
    image: "compound-ghk-cu",
    evidenceLevel: "human trials",
  },
  {
    name: "MOTS-c",
    category: "Metabolism",
    description: "A peptide derived from mitochondrial DNA. Preclinical studies explore its role in energy metabolism and insulin sensitivity.",
    image: "compound-mots-c",
    evidenceLevel: "preclinical",
  },
  {
    name: "Semax",
    category: "Cognition",
    description: "A synthetic heptapeptide. Research explores potential effects on cognitive function and neuroprotection in preclinical models.",
    image: "compound-semax",
    evidenceLevel: "preclinical",
  },
];

export interface CategoryCount {
  category: string;
  count: number;
}

// Kept for the "research categories" counter — with today's 5 compounds
// each in their own category, a bar chart of this would be flat (every
// category = 1), so evidenceLevelCounts() below is what actually renders
// as bars. This is still real, still derived, just not what the chart
// shows.
export function categoryCounts(): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const c of compoundLibrary) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  return [...counts.entries()].map(([category, count]) => ({ category, count }));
}

export interface EvidenceLevelCount {
  level: EvidenceLevel;
  label: string;
  count: number;
}

const EVIDENCE_LEVEL_ORDER: EvidenceLevel[] = ["human trials", "animal models", "preclinical"];
const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, string> = {
  "human trials": "Human trials",
  "animal models": "Animal models",
  preclinical: "Preclinical only",
};

// The distribution that actually varies today (1 / 1 / 3) — and the one a
// clinic evaluating Sunny actually cares about: how much real evidence
// stands behind the catalog, not how many categories it's sorted into.
export function evidenceLevelCounts(): EvidenceLevelCount[] {
  const counts = new Map<EvidenceLevel, number>();
  for (const c of compoundLibrary) counts.set(c.evidenceLevel, (counts.get(c.evidenceLevel) ?? 0) + 1);
  return EVIDENCE_LEVEL_ORDER.map((level) => ({
    level,
    label: EVIDENCE_LEVEL_LABELS[level],
    count: counts.get(level) ?? 0,
  }));
}
