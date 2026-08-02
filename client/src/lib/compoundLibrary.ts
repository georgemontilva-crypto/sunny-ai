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
}

export const compoundLibrary: CompoundEntry[] = [
  {
    name: "BPC-157",
    category: "Tissue Repair",
    description: "Synthetic fragment from a gastric protective protein. Preclinical research explores its role in tendon, ligament, and gastrointestinal tissue repair.",
    image: "compound-bpc-157",
    evidenceLevel: "preclinical",
  },
  {
    name: "TB-500",
    category: "Recovery",
    description: "Synthetic version of thymosin beta-4 fragment. Studied in animal models for wound healing and cellular motility in basic cell biology.",
    image: "compound-tb-500",
    evidenceLevel: "animal models",
  },
  {
    name: "GHK-Cu",
    category: "Skin Health",
    description: "Copper complex with naturally occurring tripeptide. Most published research in dermatology, focused on skin regeneration and collagen synthesis.",
    image: "compound-ghk-cu",
    evidenceLevel: "human trials",
  },
  {
    name: "MOTS-c",
    category: "Metabolism",
    description: "Peptide derived from mitochondrial DNA. Preclinical studies explore its role in energy metabolism and insulin sensitivity.",
    image: "compound-mots-c",
    evidenceLevel: "preclinical",
  },
  {
    name: "Semax",
    category: "Cognition",
    description: "Synthetic heptapeptide. Research explores potential effects on cognitive function and neuroprotection in preclinical models.",
    image: "compound-semax",
    evidenceLevel: "preclinical",
  },
];

export interface CategoryCount {
  category: string;
  count: number;
}

// Real, derived, and — with today's 5 compounds each in their own category
// — flat (every bar comes out equal). That's an accurate picture of a small
// catalog, not a bug to disguise with an invented "volume" number.
export function categoryCounts(): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const c of compoundLibrary) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  return [...counts.entries()].map(([category, count]) => ({ category, count }));
}
