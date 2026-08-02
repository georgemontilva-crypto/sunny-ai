// client/src/generated/settings-map.json is written by
// scripts/generate-settings-map.ts before every build. Components read
// partner-page settings only through getSetting below — never the DB
// directly, and never a runtime fetch (PartnerPage stays prerendered).
import settingsMap from "../generated/settings-map.json";

type SettingsMap = Record<string, string>;

declare global {
  interface Window {
    __SETTINGS_MAP__?: SettingsMap;
  }
}

// Same problem and same fix as client/src/lib/media.ts: the static import
// above is frozen into the CLIENT bundle at whatever `vite build` last ran,
// but server/republish.ts (triggered on every settings.update for a
// partner_* key) only regenerates the SSR bundle and the prerendered HTML.
// prerender.mjs injects the map it actually rendered from as
// window.__SETTINGS_MAP__, so hydration reads the same fresh data instead
// of the bundle's frozen copy.
function currentMap(): SettingsMap {
  if (typeof window !== "undefined" && window.__SETTINGS_MAP__) {
    return window.__SETTINGS_MAP__;
  }
  return settingsMap as SettingsMap;
}

// "" (missing key or explicitly cleared) both mean "not set" — callers
// decide what that means (a dashed placeholder, a hidden line), never a
// guessed value.
export function getSetting(key: string): string {
  return currentMap()[key] ?? "";
}
