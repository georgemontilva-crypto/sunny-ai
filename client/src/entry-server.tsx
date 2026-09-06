import { prerenderToNodeStream } from "react-dom/static";
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

// prerenderToNodeStream, not renderToString, and the difference is the whole
// reason the route components in App.tsx can be lazy().
//
// renderToString is synchronous: it cannot wait for a dynamic import, so a
// lazy() route would have rendered its Suspense fallback ("Loading…") into
// the static HTML and shipped a blank page to every crawler. React 19's
// static prerender API resolves every Suspense boundary first and only then
// completes, so the output is the finished page — which lets /contact,
// /partner, /blog/* and the legal pages carry their own chunks instead of
// riding along in the home page's bundle.
//
// The markup gains React's Suspense boundary comments (<!--$--> … <!--/$-->).
// hydrateRoot reads those; they're what lets it keep the server HTML on
// screen while a boundary's chunk is still downloading, which is exactly the
// behaviour we want on a prerendered page.
async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export async function render(url: string): Promise<RenderResult> {
  const path = url.split("?")[0] || "/";
  const head = getMetaForPath(path);

  const { prelude } = await prerenderToNodeStream(
    <Router ssrPath={path}>
      <App />
    </Router>,
    {
      // A lazy chunk that fails to resolve must fail the build loudly rather
      // than quietly prerendering a "Loading…" placeholder into a page that
      // then gets served to visitors and crawlers for the life of the deploy.
      onError(error) {
        throw error;
      },
    }
  );

  const html = await streamToString(prelude);
  return { html, head, canonicalHref: canonicalUrl(head.canonicalPath) };
}
