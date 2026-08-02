// Stamps this build with a commit + timestamp so it's possible to look at a
// *running* container and answer "is this actually today's code?" without
// guessing. server/index.ts logs this at startup and serves it from
// /api/public/build-info; server/republish.ts logs it at the start of every
// republish run. If a deploy is ever serving stale content, comparing this
// fingerprint against the latest pushed commit tells you immediately
// whether the problem is "wrong code got built" (fingerprint is old) or
// something else entirely (fingerprint is correct, so the bug is downstream
// of the build).
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function gitCommit() {
  try {
    return execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim();
  } catch {
    return null;
  }
}

const info = {
  // Railway injects these at build time for the commit that triggered the
  // build; git is a local-dev fallback (and a sanity check if both are
  // present but disagree).
  commit: process.env.RAILWAY_GIT_COMMIT_SHA ?? gitCommit() ?? "unknown",
  branch: process.env.RAILWAY_GIT_BRANCH ?? "unknown",
  deploymentId: process.env.RAILWAY_DEPLOYMENT_ID ?? "unknown",
  builtAt: new Date().toISOString(),
};

const dest = path.join(ROOT, "dist-server", ".build-info.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(info, null, 2));
console.log(`[build-info] commit=${info.commit} branch=${info.branch} deploymentId=${info.deploymentId} builtAt=${info.builtAt}`);
