// Republishes the static site after a media upload — no external deploy
// hook (Railway doesn't expose one for this service), no container
// restart. Regenerates HTML only: JS/CSS assets don't change, so there's
// no need to re-run `vite build`, just the media map + prerender pass.
//
// Batches uploads: several in a row reset the 60s timer instead of each
// triggering its own run. Single-flight: if a new upload lands while a
// republish is actively running, it's queued (not run in parallel) and
// re-arms the debounce once the current run finishes.
//
// prerender.mjs writes into a temp directory (never dist/ directly); only
// once it exits successfully do we copy those files over dist/. A failed
// run leaves dist/ exactly as it was — no half-applied output.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DEBOUNCE_MS = 60_000;
const ROOT = path.resolve(import.meta.dirname, ".."); // bundled to dist-server/index.mjs at runtime
const TEMP_DIR = path.join(ROOT, "dist-tmp");
const DIST_DIR = path.join(ROOT, "dist");
// The tsx package's actual JS entry, run via `node <path>` — not `pnpm exec
// tsx` (this project already lost a deploy to nixpacks not putting a tool
// on PATH at runtime, Caddy) and not node_modules/.bin/tsx either (that's a
// shell shim with a shebang, platform-dependent; the underlying .mjs file
// works identically invoked with `node` on any OS).
const TSX_CLI = path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");

// A container restart mid-republish kills the child processes with it,
// possibly leaving a partial dist-tmp/ behind — dist/ was never touched at
// that point (the copy only happens after both children exit 0), so it's
// still fully consistent. republish() already wipes TEMP_DIR at both its
// start and end, so an orphaned dist-tmp/ can't block the next run either
// way; this just clears it proactively at boot instead of leaving it on
// disk until the next upload happens to trigger one.
fs.rmSync(TEMP_DIR, { recursive: true, force: true });

export type PublishStatus = "idle" | "pending" | "publishing" | "published" | "error";

let status: PublishStatus = "idle";
let lastError: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let running = false;
let queued = false;

export function getPublishStatus(): { status: PublishStatus; error: string | null } {
  return { status, error: lastError };
}

export function scheduleRepublish(): void {
  if (running) {
    queued = true;
    status = "pending";
    return;
  }
  status = "pending";
  lastError = null;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void republish();
  }, DEBOUNCE_MS);
}

function runChild(command: string, args: string[], extraEnv?: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: "inherit",
      env: extraEnv ? { ...process.env, ...extraEnv } : process.env,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

async function republish(): Promise<void> {
  running = true;
  status = "publishing";

  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    // Refresh client/src/generated/media-map.json from the DB first — the
    // SSR bundle prerender.mjs builds inlines that JSON at build time, so a
    // stale map would prerender the *old* image URLs.
    await runChild(process.execPath, [TSX_CLI, "scripts/generate-media-map.ts"]);
    await runChild(process.execPath, ["scripts/prerender.mjs"], { PRERENDER_OUT_DIR: TEMP_DIR });

    copyDirRecursive(TEMP_DIR, DIST_DIR);
    status = "published";
  } catch (err) {
    status = "error";
    lastError = err instanceof Error ? err.message : String(err);
    console.error("[republish] failed:", err);
  } finally {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    running = false;
    if (queued) {
      queued = false;
      scheduleRepublish();
    }
  }
}
