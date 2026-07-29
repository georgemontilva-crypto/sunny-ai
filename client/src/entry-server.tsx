import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import App from "./App";
import { getMetaForPath, canonicalUrl, type HeadMeta } from "./lib/seo";

export type { HeadMeta };
export { getAllPosts } from "./lib/blog";
export { SITE } from "@shared/site";

export interface RenderResult {
  html: string;
  head: HeadMeta;
  canonicalHref: string;
}

export function render(url: string): RenderResult {
  const path = url.split("?")[0] || "/";
  const head = getMetaForPath(path);
  const html = renderToString(
    <Router ssrPath={path}>
      <App />
    </Router>
  );
  return { html, head, canonicalHref: canonicalUrl(head.canonicalPath) };
}
