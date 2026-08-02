// client/src/generated/media-map.json is written by
// scripts/generate-media-map.ts before every build. Components always go
// through getSlotUrl below — never a literal /slot.webp path.
import mediaMap from "../generated/media-map.json";

type VariantName = "base" | "2x" | "mobile";
type SlotEntry = Partial<Record<VariantName, string>>;
type MediaMap = Record<string, SlotEntry>;

declare global {
  interface Window {
    __MEDIA_MAP__?: MediaMap;
  }
}

// The static import above is frozen into the CLIENT bundle at whatever
// `vite build` last ran — server/republish.ts never re-runs that (only the
// SSR bundle + prerender pass), so after any image change through the
// panel, the deployed client JS still carries the old map. Hydrating with
// that stale import overwrote the correct src attributes the fresh SSR
// render had just produced, which is why a published image change looked
// like it "reverted" on load.
//
// scripts/prerender.mjs injects the map it actually rendered from as
// window.__MEDIA_MAP__ in every page's HTML, so hydration can read the same
// fresh data the server just used instead of the bundle's frozen copy.
// window.__MEDIA_MAP__ is only absent in `pnpm dev` (no prerender pass ever
// runs there) and during SSR itself (no `window`) — both fall back to the
// static import, which is correct in both of those cases: dev builds it
// fresh on every request, and prerender.mjs rebuilds the SSR bundle fresh
// on every run.
function currentMap(): MediaMap {
  if (typeof window !== "undefined" && window.__MEDIA_MAP__) {
    return window.__MEDIA_MAP__;
  }
  return mediaMap as MediaMap;
}

// No guessed fallback here on purpose: generate-media-map.ts only ever puts
// a real entry in the map for a variant that exists on disk (client/public)
// or in the DB, so a missing entry means the slot is genuinely empty — a
// component can render a placeholder instead of a broken <img>.
export function getSlotUrl(slot: string, variant: VariantName = "base"): string | undefined {
  return currentMap()[slot]?.[variant];
}
