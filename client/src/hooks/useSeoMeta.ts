import { useEffect } from "react";
import { useLocation } from "wouter";
import { getMetaForPath, canonicalUrl } from "@/lib/seo";
import { getSlotUrl } from "@/lib/media";
import { SITE } from "@shared/site";

function metaElement(name: string, property: boolean): HTMLMetaElement | null {
  const attr = property ? "property" : "name";
  return document.querySelector(`meta[${attr}="${name}"]`);
}

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = metaElement(name, property);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// Undefined content removes the tag instead of blanking it. Needed because
// these are per-route: navigating from an article to the home page has to
// take article:published_time off the document, not leave it there claiming
// the home page was published in May.
function setOrRemoveMeta(name: string, content: string | undefined, property = false) {
  if (content === undefined) {
    metaElement(name, property)?.remove();
    return;
  }
  setMeta(name, content, property);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// Prerendered pages already ship correct <head> tags server-side. This hook
// keeps them in sync during client-side navigation (wouter doesn't reload
// the document, so the initial <head> would otherwise stick on every route).
//
// It mirrors what scripts/prerender.mjs writes, tag for tag — including the
// article and image tags, which is why they're set through setOrRemoveMeta:
// a tag the next route doesn't have must come off, not linger.
export function useSeoMeta() {
  const [location] = useLocation();

  useEffect(() => {
    const meta = getMetaForPath(location);
    // Same precedence as prerender.mjs: a page's own image wins over the
    // site-wide og-image slot, and neither falls back to a URL that 404s.
    const siteImage = getSlotUrl("og-image");
    const image = meta.image ?? (siteImage ? { url: siteImage, alt: SITE.name } : undefined);
    const href = canonicalUrl(meta.canonicalPath);

    document.title = meta.title;
    // <html lang> follows the page, so a Spanish article read after an
    // English one doesn't stay announced as English by a screen reader.
    document.documentElement.lang = meta.lang ?? SITE.lang;

    setMeta("description", meta.description);
    setMeta("robots", meta.noindex ? "noindex, nofollow" : "index, follow");
    setCanonical(href);

    setMeta("og:title", meta.title, true);
    setMeta("og:description", meta.description, true);
    setMeta("og:url", href, true);
    setMeta("og:type", meta.ogType ?? "website", true);
    setMeta("og:locale", (meta.lang ?? SITE.lang).replace("-", "_"), true);
    setOrRemoveMeta("og:image", image?.url, true);
    setOrRemoveMeta("og:image:alt", image?.alt, true);

    setOrRemoveMeta("article:published_time", meta.article?.publishedTime, true);
    setOrRemoveMeta("article:modified_time", meta.article?.modifiedTime, true);
    setOrRemoveMeta("article:section", meta.article?.section, true);

    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", meta.title);
    setMeta("twitter:description", meta.description);
    setOrRemoveMeta("twitter:image", image?.url);
    setOrRemoveMeta("twitter:image:alt", image?.alt);
  }, [location]);
}
