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

// What a run does, in order — named so the panel can say which part failed
// instead of a bare "failed". "lock" is waiting for another process's
// republish (see acquireCrossProcessLock), before any step runs.
export type PublishStep = "lock" | "media-map" | "settings-map" | "blog-map" | "prerender";

export interface PublishReport {
  status: PublishStatus;
  // One line per failed step, "<step>: <reason>". null when nothing failed.
  error: string | null;
  failedSteps: PublishStep[];
  // Whether the run still updated the live site. A failed generator leaves
  // its previous JSON in place, so the prerender still runs — the site gets
  // everything that did regenerate, and the failed part keeps showing its
  // last good version. Only a failed lock or prerender leaves dist/ as it was.
  siteUpdated: boolean;
}

// Each one rewrites one client/src/generated/*.json from the database, and
// prerender.mjs inlines all three.
const GENERATORS: { step: PublishStep; script: string }[] = [
  { step: "media-map", script: "scripts/generate-media-map.ts" },
  { step: "settings-map", script: "scripts/generate-settings-map.ts" },
  { step: "blog-map", script: "scripts/generate-blog-map.ts" },
];

let status: PublishStatus = "idle";
let lastReport: Omit<PublishReport, "status"> = { error: null, failedSteps: [], siteUpdated: false };
let running = false;
let queued = false;
let runCounter = 0;

export function getPublishStatus(): PublishReport {
  return { status, ...lastReport };
}

// Work that has to wait until the live site stops pointing at something —
// deleting the image a published article used before it was edited, say.
// Runs after the next successful republish with nothing queued behind it, so
// the HTML it waited for reflects the latest save; a failed republish leaves
// it pending for the one after, instead of deleting a file a page that's
// still live displays. Keyed, so repeated saves replace the task rather than
// piling up copies. In-memory only: a restart drops it, and the cost of that
// is a leftover file, never a missing one.
const afterPublishTasks = new Map<string, () => Promise<void>>();

export function runAfterPublish(key: string, task: () => Promise<void>): void {
  afterPublishTasks.set(key, task);
}

async function drainAfterPublishTasks(id: number): Promise<void> {
  const tasks = [...afterPublishTasks.entries()];
  afterPublishTasks.clear();
  for (const [key, task] of tasks) {
    try {
      await task();
    } catch (err) {
      console.error(`[republish#${id}] after-publish task "${key}" failed —`, err);
    }
  }
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

class ChildProcessFailure extends Error {
  constructor(
    message: string,
    readonly stderrTail: string[]
  ) {
    super(message);
  }
}

// stderr is piped rather than inherited so a failure can carry the child's
// own explanation to the panel ("exited with code 1" says nothing) — but
// every chunk is still written through to this process's stderr, so the
// Railway logs read exactly as before.
function runChild(command: string, args: string[], extraEnv?: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: ["inherit", "inherit", "pipe"],
      env: extraEnv ? { ...process.env, ...extraEnv } : process.env,
    });
    const tail: string[] = [];
    child.stderr.on("data", (chunk: Buffer) => {
      process.stderr.write(chunk);
      tail.push(...chunk.toString("utf-8").split(/\r?\n/).filter((line) => line.trim() !== ""));
      if (tail.length > 50) tail.splice(0, tail.length - 50);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new ChildProcessFailure(`${command} ${args.join(" ")} exited with code ${code}`, tail));
    });
  });
}

// One line for the panel. The generators print "[blog-map] FAILED: <reason>"
// in --strict-on-error mode, so that's preferred; otherwise the first line
// that looks like an error (prerender.mjs prints a stack), otherwise the last.
function describeFailure(err: unknown): string {
  let reason = err instanceof Error ? err.message : String(err);
  if (err instanceof ChildProcessFailure && err.stderrTail.length > 0) {
    const failedLine = [...err.stderrTail].reverse().find((line) => line.includes("FAILED:"));
    const errorLine = err.stderrTail.find((line) => /error/i.test(line));
    const line = failedLine ?? errorLine ?? err.stderrTail[err.stderrTail.length - 1];
    reason = failedLine ? line.slice(line.indexOf("FAILED:") + "FAILED:".length).trim() : line.trim();
  }
  return reason.length > 300 ? `${reason.slice(0, 297)}...` : reason;
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

type GeneratedMap = Record<string, unknown>;

function readGeneratedMap(fileName: string): GeneratedMap | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, "client", "src", "generated", fileName), "utf-8"));
  } catch {
    return null; // missing or corrupt — treated the same as "empty" below
  }
}

function isMediaMapEmpty(map: GeneratedMap | null): boolean {
  if (!map) return true;
  return Object.values(map).every((entry) => entry !== null && typeof entry === "object" && Object.keys(entry).length === 0);
}

function isSettingsMapEmpty(map: GeneratedMap | null): boolean {
  if (!map) return true;
  return Object.keys(map).length === 0;
}

// Guards against exactly the failure this project hit on Railway:
// mysql.railway.internal only resolves once the container is actually
// running, not during the build phase, so a build with no DB access bakes
// empty media-map.json/settings-map.json into the static build — no
// images, no settings-backed pricing/copy — and nothing regenerates them
// until the next deploy touches those scripts again. Called once at server
// startup (server/index.ts) where the private network IS reachable, so
// this succeeds with real data within seconds of boot, no manual
// intervention needed. A false-positive republish (maps that are
// legitimately empty — nothing uploaded/configured yet) is harmless: it
// just regenerates the same empty output.
export function republishIfGeneratedMapsAreEmpty(): void {
  if (!process.env.DATABASE_URL) {
    console.log("[republish] startup check skipped: DATABASE_URL not set");
    return;
  }

  // blog-map.json is deliberately NOT part of this test. An empty blog map
  // is a legitimate steady state (nothing published yet), so testing it here
  // would schedule a pointless republish on every single boot until the
  // first article goes live. It doesn't need to be tested anyway: all three
  // maps are generated from the same database, so a build that couldn't
  // reach it leaves media-map and settings-map empty too — and the republish
  // this schedules regenerates the blog map along with them.
  const mediaEmpty = isMediaMapEmpty(readGeneratedMap("media-map.json"));
  const settingsEmpty = isSettingsMapEmpty(readGeneratedMap("settings-map.json"));

  if (!mediaEmpty && !settingsEmpty) {
    console.log("[republish] startup check: media-map and settings-map both have data, no republish needed");
    return;
  }

  console.log(
    `[republish] startup check: media-map empty=${mediaEmpty} settings-map empty=${settingsEmpty} — ` +
      "this build likely ran without access to the private database host (resolves only at runtime, not at " +
      "build time). Scheduling a republish now."
  );
  scheduleRepublish();
}

async function republish(): Promise<void> {
  const id = ++runCounter;
  const tempDir = path.join(ROOT, `dist-tmp-${id}`);
  console.log(`[republish#${id}] starting`);
  console.log(`[republish#${id}] ROOT=${ROOT} DIST_DIR=${DIST_DIR} tempDir=${tempDir}`);
  logBuildInfo(id);

  let releaseLock: (() => Promise<void>) | null = null;
  const ran: PublishStep[] = [];
  const failures: { step: PublishStep; reason: string }[] = [];
  let siteUpdated = false;

  const runStep = async (step: PublishStep, run: () => Promise<void>): Promise<boolean> => {
    ran.push(step);
    try {
      await run();
      return true;
    } catch (err) {
      failures.push({ step, reason: describeFailure(err) });
      return false;
    }
  };

  try {
    try {
      releaseLock = await acquireCrossProcessLock(id);
    } catch (err) {
      failures.push({ step: "lock", reason: describeFailure(err) });
    }

    if (failures.length === 0) {
      fs.rmSync(tempDir, { recursive: true, force: true });

      // Refresh client/src/generated/media-map.json, settings-map.json and
      // blog-map.json from the DB first — prerender.mjs inlines all three,
      // so stale copies would prerender old image URLs, old partner-page
      // pricing, or miss a just-published article.
      //
      // Each runs no matter how the others went. They used to be chained,
      // so a failure in media-map meant blog-map never ran at all and a
      // freshly published article never reached the site, with nothing in
      // the panel pointing at why. --strict-on-error still matters: a failing
      // generator leaves its previous JSON untouched instead of writing an
      // empty one, so the prerender below always has a complete set of
      // inputs — fresh where the generator succeeded, last-good where not.
      for (const { step, script } of GENERATORS) {
        await runStep(step, () => runChild(process.execPath, [TSX_CLI, script, "--strict-on-error"]));
      }
      siteUpdated = await runStep("prerender", async () => {
        await runChild(process.execPath, ["scripts/prerender.mjs"], { PRERENDER_OUT_DIR: tempDir });
        copyDirRecursive(tempDir, DIST_DIR);
      });
    }

    // Any failure makes the run an error, even when the site was updated
    // with everything else — "published" would hide that part of it is
    // stale.
    status = failures.length === 0 ? "published" : "error";
    lastReport = {
      error: failures.length === 0 ? null : failures.map((f) => `${f.step}: ${f.reason}`).join("\n"),
      failedSteps: failures.map((f) => f.step),
      siteUpdated,
    };
    const summary = ran.map((step) => `${step}=${failures.some((f) => f.step === step) ? "FAILED" : "ok"}`).join(" ");
    if (failures.length === 0) {
      console.log(`[republish#${id}] finished: published (${summary})`);
    } else {
      console.error(
        `[republish#${id}] finished: FAILED at ${lastReport.failedSteps.join(", ")} (${summary || "no steps ran"}) — ` +
          (siteUpdated ? "live site updated with everything that succeeded" : "live site NOT updated")
      );
      for (const f of failures) console.error(`[republish#${id}]   ${f.step}: ${f.reason}`);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (releaseLock) await releaseLock();
    running = false;
    if (queued) {
      queued = false;
      scheduleRepublish();
    } else if (status === "published") {
      void drainAfterPublishTasks(id);
    }
  }
}
