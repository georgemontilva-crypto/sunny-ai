// Caches the pristine vite-built index.html (still has the unreplaced
// <!--app-html-->/<!--app-head--> placeholders) somewhere prerender.mjs can
// keep reading it from on every later run — dist/index.html itself gets
// overwritten with real page content the first time prerender.mjs runs, so
// it can't serve as the template for the next run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(ROOT, "dist", "index.html");
const dest = path.join(ROOT, "dist-server", ".prerender-template.html");

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log(`[cache-template] cached ${src} -> ${dest}`);
