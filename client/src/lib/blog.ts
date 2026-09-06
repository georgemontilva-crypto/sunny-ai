// The blog's read path. Posts live in the `posts` table and are managed
// from /admin/blog, but nothing here ever queries the database or fetches
// at runtime: scripts/generate-blog-map.ts resolves the *published* rows
// into client/src/generated/blog-map.json before every build and every
// republish, and /blog + /blog/:slug stay fully prerendered — the same
// build-time resolution client/src/lib/media.ts and settings.ts use.
//
// Drafts never reach this map, so an unpublished post has no prerendered
// page, no sitemap entry and no card in the list. That's the whole
// mechanism behind "Save draft changes nothing public".
import blogMap from "../generated/blog-map.json";
import { getSlotUrl } from "./media";
import type { BlogPost } from "@shared/blog";
import { absoluteUrl } from "@shared/site";

export type { BlogPost };

declare global {
  interface Window {
    __BLOG_MAP__?: BlogPost[];
  }
}

// Same staleness problem, same fix as media.ts/settings.ts: the static
// import above is frozen into the CLIENT bundle at whatever `vite build`
// last ran, and server/republish.ts (fired on publish/unpublish) only
// regenerates the SSR bundle and the prerendered HTML. scripts/prerender.mjs
// injects the map it actually rendered from as window.__BLOG_MAP__, so
// hydration reads the same fresh data instead of the bundle's frozen copy —
// otherwise a freshly published post would render server-side and then
// vanish the moment React hydrated.
function currentPosts(): BlogPost[] {
  if (typeof window !== "undefined" && window.__BLOG_MAP__) {
    return window.__BLOG_MAP__;
  }
  return blogMap as BlogPost[];
}

// Already ordered newest-first by the generator; not re-sorted here so the
// list, the prerendered routes and the sitemap can't disagree.
export function getAllPosts(): BlogPost[] {
  return currentPosts();
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return currentPosts().find((post) => post.slug === slug);
}

// The post's cover as an absolute URL, for og:image and the BlogPosting
// JSON-LD. Undefined when the post points at no slot, or at one nothing has
// been uploaded to yet — both callers omit their field in that case rather
// than emit a URL that 404s, which is worse in a share card or a rich result
// than having no image at all.
//
// getSlotUrl already returns an absolute R2 URL; absoluteUrl() is a
// defensive no-op that guards against double-prefixing if that ever changes.
export function postImageUrl(post: BlogPost): string | undefined {
  if (!post.coverSlot) return undefined;
  const url = getSlotUrl(post.coverSlot);
  if (!url) return undefined;
  return url.startsWith("http") ? url : absoluteUrl(url);
}
