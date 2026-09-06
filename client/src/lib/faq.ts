// The home page's FAQ, in one place because it now has two readers: the
// accordion in components/landing/FAQ.tsx and the FAQPage JSON-LD in
// lib/jsonLd.ts. Google can render this block as an expandable FAQ directly
// in the results, so the answer it indexes has to be the answer on the page
// — a second, hand-written copy for the structured data is exactly how those
// two drift apart and how the rich result stops matching the page.
//
// Answers are segments rather than a plain string because one of them
// contains a link. `faqAnswerText()` flattens them for the JSON-LD; FAQ.tsx
// renders the same segments with the link as a real <Link>. Neither one
// retypes the other's text.

export interface FaqLinkSegment {
  text: string;
  href: string;
}

export type FaqAnswerSegment = string | FaqLinkSegment;

export interface FaqEntry {
  q: string;
  a: FaqAnswerSegment[];
}

export const FAQS: FaqEntry[] = [
  {
    q: "Does Sunny sell or distribute peptides?",
    a: [
      "No. Sunny doesn't sell, manufacture, or distribute any compound. We publish educational summaries of available scientific literature, nothing more.",
    ],
  },
  {
    q: "Is this medical advice?",
    a: [
      "No. Nothing we publish diagnoses, treats, or prescribes. It's educational and research content — any decision about your health should go through a qualified professional.",
    ],
  },
  {
    q: "Why don't you include dosing or protocols?",
    a: [
      "Because it isn't information that's ours to give. Dosing is a clinical decision that depends on each individual, and only a qualified health professional can assess it.",
    ],
  },
  {
    q: "How do you decide which compounds to include in the library?",
    a: [
      "We prioritize compounds with published, verifiable literature — preclinical or clinical — and we say so explicitly on each entry. If the evidence is weak or nonexistent, we say that too.",
    ],
  },
  {
    q: "Do you offer integrations for clinics or brands?",
    a: [
      "Yes, through embed or white-label. Check out ",
      { text: "our page for clinics and brands", href: "/partner" },
      ", or reach out through the contact form.",
    ],
  },
];

// The answer as one plain string — what goes into the JSON-LD's
// acceptedAnswer.text. Link segments contribute their visible text, so the
// indexed answer reads exactly like the rendered one.
export function faqAnswerText(entry: FaqEntry): string {
  return entry.a.map((segment) => (typeof segment === "string" ? segment : segment.text)).join("");
}
