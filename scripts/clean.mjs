// Runs first in `pnpm build`, before anything else touches disk. If the
// build environment ever reuses a filesystem from a previous build (a
// nixpacks/Docker layer cache, a Railway volume mounted over the app root —
// anything outside this repo's control), a leftover dist/, dist-server/, or
// .ssr-tmp/ from an OLD build could otherwise survive right through a build
// that never rewrites every file in them. Wiping all three unconditionally
// means every build is provably reconstructed from the current checkout,
// not merged with whatever was already sitting there.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Logs what it found *before* deleting it — a stale dist/ surviving a fresh
// git checkout (dist/ is gitignored, so a real clone never has one) is
// itself the evidence, whether or not the delete below actually sticks
// (e.g. a volume remounting old content back over this path after the
// build phase would make this log line show a deletion that didn't last).
for (const dir of ["dist", "dist-server", ".ssr-tmp"]) {
  const full = path.join(ROOT, dir);
  if (fs.existsSync(full)) {
    const entries = fs.readdirSync(full);
    console.log(`[clean] found existing ${full} — ${entries.length} entries: ${entries.slice(0, 10).join(", ")}${entries.length > 10 ? ", ..." : ""}`);
    const indexHtml = path.join(full, "index.html");
    if (fs.existsSync(indexHtml)) {
      const stat = fs.statSync(indexHtml);
      console.log(`[clean]   ${indexHtml} mtime=${stat.mtime.toISOString()} size=${stat.size}`);
    }
  } else {
    console.log(`[clean] ${full} did not exist`);
  }
  fs.rmSync(full, { recursive: true, force: true });
}
console.log("[clean] removed dist/, dist-server/, .ssr-tmp/");
