// Republishes the static site after a media upload — no external deploy
// hook (Railway doesn't expose one for this service), no container
// restart. Regenerates HTML only: JS/CSS assets don't change, so there's
// no need to re-run `vite build`, just the media map + prerender pass.
//
// Fires immediately on confirmUpload, no debounce — the whole pass runs in
// well under a second, so there's nothing to batch. Single-flight within
// this process via `running`/`queued` (the mutex is acquired synchronously
// in scheduleRepublish itself, before any await, so there's no check/set
// gap for two same-process calls to race through).
//
// That alone isn't enough if Railway ever runs more than one instance of
// this service (extra replicas, or the brief overlap window of a rolling
// deploy) — each process has its own memory, so two processes can each
// think they're the only one running and both regenerate + copy into
// dist/ at once. That's the actual bug this was hitting: two concurrent
// runs writing over each other, and whichever finished last (not
// necessarily the one with the freshest DB read) won. A MySQL advisory
// lock (GET_LOCK/RELEASE_LOCK) serializes across processes too — the
// second one waits, then runs with a fresh DB read, so the result is
// always consistent with whatever's in the database by the time it's that
// run's turn, regardless of which process started first.
//
// prerender.mjs writes into a run-specific temp directory (never dist/
// directly, and never shared between runs); only once it exits
// successfully do we copy those files over dist/. A failed run leaves
// dist/ exactly as it was — no half-applied output.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const ROOT = path.resolve(import.meta.dirname, ".."); // bundled to dist-server/index.mjs at runtime
const DIST_DIR = path.join(ROOT, "dist");
// The tsx package's actual JS entry, run via `node <path>` — not `pnpm exec
// tsx` (this project already lost a deploy to nixpacks not putting a tool
// on PATH at runtime, Caddy) and not node_modules/.bin/tsx either (that's a
// shell shim with a shebang, platform-dependent; the underlying .mjs file
// works identically invoked with `node` on any OS).
const TSX_CLI = path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");
const LOCK_NAME = "sunny_republish";
const LOCK_WAIT_SECONDS = 30;

// A container restart mid-republish kills the child processes with it,
// possibly leaving a partial dist-tmp-*/ behind — dist/ was never touched
// at that point (the copy only happens after both children exit 0), so
// it's still fully consistent. Sweep any orphans from a prior process at
// boot rather than leaving them on disk indefinitely.
for (const entry of fs.readdirSync(ROOT)) {
  if (entry.startsWith("dist-tmp-")) {
    fs.rmSync(path.join(ROOT, entry), { recursive: true, force: true });
  }
}

export type PublishStatus = "idle" | "pending" | "publishing" | "published" | "error";

let status: PublishStatus = "idle";
let lastError: string | null = null;
let running = false;
let queued = false;
let runCounter = 0;

export function getPublishStatus(): { status: PublishStatus; error: string | null } {
  return { status, error: lastError };
}

export function scheduleRepublish(): void {
  if (running) {
    queued = true;
    status = "pending";
    return;
  }
  // Acquired synchronously, right here — not as the first line inside
  // republish() — so there's no way for a second same-tick call to read
  // `running` as false before this one sets it.
  running = true;
  status = "publishing";
  void republish();
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

// Cross-process lock. Returns a release function, or null if there's no
// DATABASE_URL to lock against (local dev without a DB — falls back to
// same-process-only protection, same as before).
async function acquireCrossProcessLock(id: number): Promise<(() => Promise<void>) | null> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  const conn = await mysql.createConnection(databaseUrl);
  const [rows] = await conn.query("SELECT GET_LOCK(?, ?) AS locked", [LOCK_NAME, LOCK_WAIT_SECONDS]);
  const locked = (rows as Array<{ locked: number | null }>)[0]?.locked;

  if (locked !== 1) {
    await conn.end().catch(() => {});
    throw new Error(
      locked === null
        ? "GET_LOCK error while acquiring the republish lock"
        : `Timed out after ${LOCK_WAIT_SECONDS}s waiting for another process's republish to finish`
    );
  }

  console.log(`[republish#${id}] acquired cross-process lock`);
  return async () => {
    await conn.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]).catch(() => {});
    await conn.end().catch(() => {});
    console.log(`[republish#${id}] released cross-process lock`);
  };
}

// Same fingerprint server/index.ts logs at startup, re-logged on every run
// so a stale-content report can pin down exactly which build's source
// prerender.mjs actually compiled from — this process never re-fetches or
// re-checks-out code, so it's always the container's build, but logging it
// here removes any doubt.
function logBuildInfo(id: number): void {
  try {
    const info = JSON.parse(fs.readFileSync(path.join(ROOT, "dist-server", ".build-info.json"), "utf-8"));
    console.log(
      `[republish#${id}] build: commit=${info.commit} branch=${info.branch} deploymentId=${info.deploymentId} builtAt=${info.builtAt}`
    );
  } catch {
    console.log(`[republish#${id}] build: no .build-info.json found`);
  }
}

async function republish(): Promise<void> {
  const id = ++runCounter;
  const tempDir = path.join(ROOT, `dist-tmp-${id}`);
  console.log(`[republish#${id}] starting`);
  console.log(`[republish#${id}] ROOT=${ROOT} DIST_DIR=${DIST_DIR} tempDir=${tempDir}`);
  logBuildInfo(id);

  let releaseLock: (() => Promise<void>) | null = null;

  try {
    releaseLock = await acquireCrossProcessLock(id);

    fs.rmSync(tempDir, { recursive: true, force: true });

    // Refresh client/src/generated/media-map.json from the DB first — the
    // SSR bundle prerender.mjs builds inlines that JSON at build time, so a
    // stale map would prerender the *old* image URLs. --strict-on-error: a
    // DB hiccup here must surface as a real failure, not a silent fallback
    // that wipes every slot's URL and still reports "published".
    await runChild(process.execPath, [TSX_CLI, "scripts/generate-media-map.ts", "--strict-on-error"]);
    await runChild(process.execPath, ["scripts/prerender.mjs"], { PRERENDER_OUT_DIR: tempDir });

    copyDirRecursive(tempDir, DIST_DIR);
    status = "published";
    console.log(`[republish#${id}] finished: published`);
  } catch (err) {
    status = "error";
    lastError = err instanceof Error ? err.message : String(err);
    console.error(`[republish#${id}] finished: failed —`, err);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (releaseLock) await releaseLock();
    running = false;
    if (queued) {
      queued = false;
      scheduleRepublish();
    }
  }
}
