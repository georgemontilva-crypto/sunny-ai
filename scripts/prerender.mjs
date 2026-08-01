// Static prerender pass, run after `vite build`.
//
// Why not vite-react-ssg: it hard-requires react-router-dom as a peer
// dependency, which conflicts with this project's "wouter puro" routing.
// Instead we build a throwaway SSR bundle of entry-server.tsx, render every
// known route with react-dom/server, and splice the markup + head tags into
// the already-built dist/index.html template (which still contains the
// <!--app-html--> / <!--app-head--> placeholders vite build doesn't touch).
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_DIR = path.join(ROOT, "dist");
const SSR_TMP_DIR = path.join(ROOT, ".ssr-tmp");

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeRouteHtml(route, html) {
  const filePath =
    route === "/"
      ? path.join(DIST_DIR, "index.html")
      : path.join(DIST_DIR, route.replace(/^\//, ""), "index.html");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html, "utf-8");
}

async function main() {
  console.log("[prerender] building SSR bundle...");
  // Entry path is resolved relative to Vite's configured `root` (client/), not cwd.
  execSync(
    `npx vite build --ssr src/entry-server.tsx --outDir ${JSON.stringify(SSR_TMP_DIR)} --emptyOutDir`,
    { stdio: "inherit", cwd: ROOT }
  );

  const ssrEntryPath = path.join(SSR_TMP_DIR, "entry-server.js");
  const { render, getAllPosts, SITE } = await import(pathToFileURL(ssrEntryPath).href);

  const staticRoutes = [
    "/",
    "/blog",
    "/contact",
    "/legal/terms",
    "/legal/privacy",
    "/legal/cookies",
    "/legal/disclaimer",
  ];
  const blogRoutes = getAllPosts().map((p) => `/blog/${p.slug}`);
  const routes = [...staticRoutes, ...blogRoutes];

  const template = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");
  const ogImageHref = `${SITE.domain}${SITE.ogImage}`;

  for (const route of routes) {
    const { html, head, canonicalHref } = render(route);
    const headTags = [
      `<title>${escapeHtml(head.title)}</title>`,
      `<meta name="description" content="${escapeHtml(head.description)}" />`,
      `<meta property="og:site_name" content="${escapeHtml(SITE.name)}" />`,
      `<meta property="og:title" content="${escapeHtml(head.title)}" />`,
      `<meta property="og:description" content="${escapeHtml(head.description)}" />`,
      `<meta property="og:url" content="${escapeHtml(canonicalHref)}" />`,
      `<meta property="og:image" content="${escapeHtml(ogImageHref)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeHtml(head.title)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(head.description)}" />`,
      `<link rel="canonical" href="${escapeHtml(canonicalHref)}" />`,
    ];
    if (head.noindex) headTags.push(`<meta name="robots" content="noindex, nofollow" />`);
    const headHtml = headTags.join("\n    ");

    const page = template
      .replace("<!--app-html-->", html)
      .replace("<!--app-head-->", headHtml);

    writeRouteHtml(route, page);
    console.log(`[prerender] wrote ${route}`);
  }

  // Empty SPA shell for /admin/* (server/index.ts falls back here for any
  // unmatched /admin path). Deliberately NOT the prerendered "/" page — reusing that
  // would hand React a DOM full of Home page markup to hydrate into on an
  // admin route, a guaranteed hydration mismatch. Never listed in `routes`,
  // the sitemap, or robots.txt's Allow — /admin is off-limits to both.
  const adminHeadHtml = [
    `<title>Panel — ${SITE.name}</title>`,
    `<meta name="robots" content="noindex, nofollow" />`,
  ].join("\n    ");
  const adminShell = template.replace("<!--app-html-->", "").replace("<!--app-head-->", adminHeadHtml);
  fs.mkdirSync(path.join(DIST_DIR, "admin"), { recursive: true });
  fs.writeFileSync(path.join(DIST_DIR, "admin", "index.html"), adminShell, "utf-8");
  console.log("[prerender] wrote /admin/index.html (empty shell)");

  // Explicit 404 page for static hosts (Netlify/Vercel/S3 convention)
  const notFound = render("/__not_found__");
  const notFoundHeadHtml = `<title>${escapeHtml(notFound.head.title)}</title>\n    <meta name="robots" content="noindex, nofollow" />`;
  const notFoundPage = template
    .replace("<!--app-html-->", notFound.html)
    .replace("<!--app-head-->", notFoundHeadHtml);
  fs.writeFileSync(path.join(DIST_DIR, "404.html"), notFoundPage, "utf-8");
  console.log("[prerender] wrote /404.html");

  // Sitemap (built regardless of `indexable` — robots.txt + noindex already
  // keep crawlers out while the site lives on the temporary domain).
  const sitemapUrls = routes
    .map((route) => `  <url><loc>${SITE.domain}${route === "/" ? "" : route}</loc></url>`)
    .join("\n");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST_DIR, "sitemap.xml"), sitemap, "utf-8");
  console.log("[prerender] wrote /sitemap.xml");

  // robots.txt: fully generated from SITE.indexable — overwrites whatever
  // vite build copied from client/public/robots.txt.
  const robotsTxt = SITE.indexable
    ? `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${SITE.domain}/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\n`;
  fs.writeFileSync(path.join(DIST_DIR, "robots.txt"), robotsTxt, "utf-8");
  console.log(`[prerender] wrote /robots.txt (indexable: ${SITE.indexable})`);

  fs.rmSync(SSR_TMP_DIR, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
