// Single process, no Caddy: Railway's nixpacks image doesn't reliably put
// `caddy` on PATH for the run phase (only the build phase saw it), so it
// serves both /api/* and the static site directly.
//
// Static resolution is deliberately NOT `express.static({ index: true })` +
// a catch-all `sendFile("index.html")` — that's the soft-404 bug this
// project hit before: every unmatched path (including typos and prerendered
// routes with a trailing-slash mismatch) would silently return the SPA
// shell with a 200, and Google indexes those as thin/empty pages. Instead:
//   1. express.static serves exact file matches only (index:false, so it
//      never guesses or redirects) — this is what serves the prerendered
//      HTML for known routes, and hashed assets.
//   2. A resolver checks disk for "<path>/index.html" — this is how a
//      prerendered route like /blog (stored at dist/blog/index.html) gets
//      served without a redirect to /blog/.
//   3. /admin/* falls back to dist/admin/index.html — the empty SPA shell
//      scripts/prerender.mjs writes, NOT the root dist/index.html (that one
//      IS the prerendered Home page; handing React that markup to mount
//      into on an admin route is a hydration mismatch).
//   4. Anything still unmatched is a real 404: dist/404.html served with an
//      actual 404 status, not 200.
import fs from "node:fs";
import path from "node:path";
import compression from "compression";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { authRoutes } from "./authRoutes.ts";
import { publicRoutes } from "./publicRoutes.ts";
import { appRouter } from "./routers/_app.ts";
import { createContext } from "./trpc.ts";

// This file is bundled to dist-server/index.mjs by esbuild; dist/ is a
// sibling of dist-server/, not of server/.
const DIST_DIR = path.resolve(import.meta.dirname, "..", "dist");
const ASSETS_DIR = `${path.sep}assets${path.sep}`;
// Never let the browser serve a prerendered page from its own cache without
// asking first — a republish after a media upload is invisible otherwise,
// since the browser would just reuse the old HTML it already has.
const HTML_CACHE_CONTROL = "no-cache, must-revalidate";

const app = express();

// Railway's edge is the only hop in front of this process now (no more
// Caddy on loopback) — trust exactly that one hop for X-Forwarded-*.
app.set("trust proxy", 1);

app.use(compression());
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);
// Any other /api/* path is a real 404, not the HTML 404 page below.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  express.static(DIST_DIR, {
    index: false,
    redirect: false,
    setHeaders(res, filePath) {
      res.setHeader(
        "Cache-Control",
        filePath.includes(ASSETS_DIR)
          ? "public, max-age=31536000, immutable" // hashed filename, content never changes under this URL
          : HTML_CACHE_CONTROL // HTML and unhashed public/ files — always revalidate
      );
    },
  })
);

// Prerendered "pretty" routes (/, /blog, /blog/:slug, ...) live on disk as
// <route>/index.html. Resolved here instead of via express.static's own
// directory-index handling so there's no 301-to-trailing-slash — the
// sitemap and canonical tags use the slash-less form.
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (req.path.startsWith("/api/") || req.path.startsWith("/admin")) return next();

  const candidate = path.join(DIST_DIR, decodeURIComponent(req.path), "index.html");
  if (fs.existsSync(candidate)) {
    res.setHeader("Cache-Control", HTML_CACHE_CONTROL);
    res.sendFile(candidate);
    return;
  }
  next();
});

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (!req.path.startsWith("/admin")) return next();

  res.setHeader("Cache-Control", HTML_CACHE_CONTROL);
  res.sendFile(path.join(DIST_DIR, "admin", "index.html"));
});

app.use((_req, res) => {
  res.status(404).set("Cache-Control", HTML_CACHE_CONTROL).sendFile(path.join(DIST_DIR, "404.html"));
});

// Logged first, before anything else, so a stale-content report starts by
// checking this line against the latest pushed commit rather than guessing.
let buildInfo: { commit?: string; branch?: string; deploymentId?: string; builtAt?: string } | null = null;
try {
  buildInfo = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, ".build-info.json"), "utf-8"));
  console.log(
    `[server] build: commit=${buildInfo?.commit} branch=${buildInfo?.branch} deploymentId=${buildInfo?.deploymentId} builtAt=${buildInfo?.builtAt}`
  );
} catch {
  console.log("[server] build: no .build-info.json found (local dev without a full `pnpm build`?)");
}

// If dist/index.html predates .build-info.json's builtAt, the two didn't
// come from the same build pass — something is serving files from outside
// what this process's own build wrote, whether that's a volume mount
// shadowing DIST_DIR at container start, or a build-cache layer that skipped
// rewriting it.
console.log(`[server] DIST_DIR=${DIST_DIR}`);
try {
  const indexPath = path.join(DIST_DIR, "index.html");
  const stat = fs.statSync(indexPath);
  const content = fs.readFileSync(indexPath, "utf-8");
  console.log(`[server] dist/index.html: mtime=${stat.mtime.toISOString()} size=${stat.size}`);
  if (buildInfo?.builtAt && stat.mtime.toISOString() < buildInfo.builtAt) {
    console.log(
      `[server] WARNING: dist/index.html mtime (${stat.mtime.toISOString()}) is older than this build's builtAt (${buildInfo.builtAt}) — this file was not written by this build`
    );
  }
  console.log(`[server] dist/index.html first 200 chars: ${JSON.stringify(content.slice(0, 200))}`);
  const scriptSrcs = [...content.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
  console.log(`[server] dist/index.html script src(s): ${JSON.stringify(scriptSrcs)}`);
  const unexpected = scriptSrcs.filter((src) => !src.startsWith("/assets/"));
  if (unexpected.length > 0) {
    console.log(
      `[server] WARNING: script src(s) outside /assets/ — not produced by this project's Vite build: ${JSON.stringify(unexpected)}`
    );
  }
} catch (err) {
  console.error("[server] failed to read dist/index.html for startup diagnostics:", err);
}

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
});
