import { useLocation } from "wouter";
import { getJsonLdForPath, serializeJsonLd } from "@/lib/jsonLd";

// One <script type="application/ld+json"> per page, holding the whole
// @graph for whatever route is currently rendered — see lib/jsonLd.ts for
// which nodes each path gets.
//
// Mounted once in App.tsx's Router rather than inside Home, which is where
// it used to live: the Organization block was only ever reaching the home
// page, and /blog/:slug and /partner now need nodes of their own. Rendering
// it here means the prerender pass bakes the right graph into every static
// page, client-side navigation swaps it, and `pnpm dev` shows the same thing
// — three behaviours that would otherwise need three implementations.
export default function SchemaMarkup() {
  const [location] = useLocation();
  const json = serializeJsonLd(getJsonLdForPath(location));

  // Null on noindex routes (the panel, the member pages) and on a /blog/:slug
  // whose post doesn't exist — nothing to describe, so no empty tag either.
  if (!json) return null;

  return (
    <script
      type="application/ld+json"
      // Built from our own config, the FAQ array and post rows, then
      // serialized by serializeJsonLd, which escapes "<" so a "</script>"
      // inside a database-authored title can't close this tag early.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
