import { useEffect } from "react";
import { useLocation } from "wouter";
import { getMetaForPath, canonicalUrl } from "@/lib/seo";

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
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
export function useSeoMeta() {
  const [location] = useLocation();

  useEffect(() => {
    const meta = getMetaForPath(location);
    document.title = meta.title;
    setMeta("description", meta.description);
    setMeta("og:title", meta.title, true);
    setMeta("og:description", meta.description, true);
    setMeta("twitter:title", meta.title);
    setMeta("twitter:description", meta.description);
    setCanonical(canonicalUrl(meta.canonicalPath));
    setMeta("og:url", canonicalUrl(meta.canonicalPath), true);
    setMeta("robots", meta.noindex ? "noindex, nofollow" : "index, follow");
  }, [location]);
}
