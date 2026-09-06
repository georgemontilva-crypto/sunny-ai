// Shared vocabulary for the blog: the shape of a published post as it's
// baked into client/src/generated/blog-map.json, plus the few derivations
// (slug, reading time) that have to agree between the admin panel, the
// build-time map generator and the public pages.
//
// Deliberately free of React and of any server import so all three can use
// it: scripts/generate-blog-map.ts (node), server/routers/blog.ts, and the
// client bundle.

export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

// The languages the panel offers. Not a hard constraint in the database
// (the column is a varchar) — it's the list the editor's select shows and
// what the router validates against.
export const POST_LANGS = ["en", "es"] as const;
export type PostLang = (typeof POST_LANGS)[number];

export const POST_LANG_LABELS: Record<PostLang, string> = {
  en: "English",
  es: "Spanish",
};

// Google truncates around these lengths. The editor counts against them and
// warns past them; nothing enforces them, because "too long" is a judgement
// call, not an error.
export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 160;

// One entry of client/src/generated/blog-map.json. Every field is a plain
// string (never null): the map generator normalizes the nullable columns so
// the public pages never have to null-check a value they only ever render.
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // markdown
  category: string;
  coverSlot: string; // "" when the post has no cover
  lang: string;
  publishedAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  metaTitle: string; // "" -> the page falls back to a title built from `title`
  metaDescription: string; // "" -> falls back to `excerpt`
  readingTimeMinutes: number;
}

// Lowercase, ASCII-ish, hyphenated. Diacritics are stripped rather than
// dropped (Spanish drafts exist), so "qué son los péptidos" keeps its
// letters instead of turning into "qu-son-los-pptidos".
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 191)
    .replace(/-+$/g, "");
}

// 200 words per minute, floor of 1. Counts the markdown source rather than
// the rendered text — close enough for a "5 min read" label, and it means
// the number can be computed without a markdown parser (the map generator
// runs in node, the renderer is React).
export function readingTimeMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
