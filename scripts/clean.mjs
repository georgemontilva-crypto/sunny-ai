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

for (const dir of ["dist", "dist-server", ".ssr-tmp"]) {
  fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true });
}
console.log("[clean] removed dist/, dist-server/, .ssr-tmp/");
