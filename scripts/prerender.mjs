// Static prerender pass. Two callers:
//   1. `pnpm build`, right after `vite build` — writes into dist/ directly.
//   2. server/republish.ts, after a media upload — writes into a temp dir
//      (PRERENDER_OUT_DIR) that the caller swaps into dist/ atomically, so a
//      failed run never leaves dist/ half-written.
//
// Why not vite-react-ssg: it hard-requires react-router-dom as a peer
// dependency, which conflicts with this project's "wouter puro" routing.
// Instead we build a throwaway SSR bundle of entry-server.tsx, render every
// known route with react-dom/server, and splice the markup + head tags into
// the vite-built index.html template (still has the unreplaced
// <!--app-html--> / <!--app-head--> placeholders).
//
// The template is read from a cached copy (scripts/cache-template.mjs),
// never from dist/index.html directly — by the time a live republish runs,
// dist/index.html is already a *previously rendered* page, not the pristine
// template, so re-reading it would just re-splice into already-spliced
// markup and silently do nothing.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_DIR = process.env.PRERENDER_OUT_DIR ? path.resolve(process.env.PRERENDER_OUT_DIR) : path.join(ROOT, "dist");
const SSR_TMP_DIR = path.join(ROOT, ".ssr-tmp");
const TEMPLATE_CACHE = path.join(ROOT, "dist-server", ".prerender-template.html");

// manifest.json's colors, kept in sync by hand with client/src/index.css's
// light-theme :root block — --background ("Arena") and --accent ("Sol").
// Not worth parsing CSS at build time for two values that change on a
// redesign, not a routine edit.
const MANIFEST_BACKGROUND_COLOR = "oklch(0.9598 0.016 82.79)";
const MANIFEST_THEME_COLOR = "oklch(0.7587 0.153 74.46)";

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
  // Compared against server/index.ts's own logged DIST_DIR at startup — a
  // full `pnpm build` run (PRERENDER_OUT_DIR unset) must resolve to the
  // exact same absolute path the running server serves static files from,
  // or nothing this script writes is ever actually served.
  console.log(`[prerender] ROOT=${ROOT}`);
  console.log(`[prerender] writing to DIST_DIR=${DIST_DIR}`);
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
    "/partner",
    "/legal/terms",
    "/legal/privacy",
    "/legal/cookies",
    "/legal/disclaimer",
  ];
  const blogRoutes = getAllPosts().map((p) => `/blog/${p.slug}`);
  const routes = [...staticRoutes, ...blogRoutes];

  if (!fs.existsSync(TEMPLATE_CACHE)) {
    throw new Error(
      `No cached template at ${TEMPLATE_CACHE} — run \`vite build\` + scripts/cache-template.mjs first (a plain \`pnpm build\` does this).`
    );
  }
  let template = fs.readFileSync(TEMPLATE_CACHE, "utf-8");
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Loaded once, used below for: the favicon/preload <link>s, resolving
  // og:image, window.__MEDIA_MAP__ (so hydration doesn't clobber this
  // render with the client bundle's frozen import — see
  // client/src/lib/media.ts), and manifest.json's icons. Defaults to {}
  // rather than failing the build: scripts/generate-media-map.ts always
  // writes *something*, but every slot resolving empty (no DB, and
  // client/public is no longer a fallback source) is a normal, supported
  // state — everything below that depends on it is written conditionally,
  // never left pointing at a file that doesn't exist.
  const mediaMapPath = path.join(ROOT, "client", "src", "generated", "media-map.json");
  const mediaMap = fs.existsSync(mediaMapPath) ? JSON.parse(fs.readFileSync(mediaMapPath, "utf-8")) : {};

  // Removes a whole <link> line (including its indentation and trailing
  // newline) rather than leaving a blank line — used whenever a slot below
  // has nothing to point the tag at.
  function dropLink(html, literalTag) {
    return html.replace(new RegExp(`[ \\t]*${literalTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\r?\\n`), "");
  }

  // The favicon <link>s and the hero-sunny preload hint are static markup
  // in the template, outside the per-route <!--app-head--> splice below,
  // so a live republish (which never re-runs `vite build`, only this
  // script) would otherwise keep serving whatever they resolved to at the
  // last full build. Removed outright when the slot is empty — the whole
  // point of this pass is that nothing here falls back to a client/public
  // file that may no longer exist.
  const svgHref = mediaMap["favicon-svg"]?.base;
  template = svgHref
    ? template.replace('href="/favicon.svg"', `href="${svgHref}"`)
    : dropLink(template, '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');

  const pngHref = mediaMap["favicon-png"]?.base;
  template = pngHref
    ? template.replace('href="/favicon.png"', `href="${pngHref}"`)
    : dropLink(template, '<link rel="icon" type="image/png" href="/favicon.png" />');

  const heroPreloadHref = mediaMap["hero-sunny"]?.base;
  template = heroPreloadHref
    ? template.replace('href="/hero-sunny.webp"', `href="${heroPreloadHref}"`)
    : dropLink(template, '<link rel="preload" as="image" href="/hero-sunny.webp" />');

  // Already an absolute R2 URL when set (client/public is no longer a
  // fallback source, so there's no relative path to prepend SITE.domain
  // to) — undefined omits the og:image/twitter:card meta tags below
  // entirely instead of pointing them at nothing.
  const ogImageHref = mediaMap["og-image"]?.base;

  {
    // The CLIENT bundle (dist/assets/*.js) is built once by `vite build` and
    // never rebuilt by a republish — only this script and the SSR bundle
    // are. It statically imports media-map.json, so its copy goes stale the
    // moment an image changes through the panel; hydrating with that frozen
    // import overwrote the correct src attributes this same script had just
    // rendered into the HTML below. Injecting the map that's actually fresh
    // right now lets client/src/lib/media.ts read window.__MEDIA_MAP__
    // instead of its bundled import — placed before the module script tag
    // so it's defined before any component reads it.
    // `<` -> `\u003c` prevents a `</script>` (or `<!--`) inside a URL from
    // closing this script tag early.
    const mediaMapScript = `<script>window.__MEDIA_MAP__ = ${JSON.stringify(mediaMap).replace(/</g, "\\u003c")};</script>`;
    if (!template.includes('<script type="module"')) {
      throw new Error('Expected a <script type="module"> tag in the cached template to inject window.__MEDIA_MAP__ before.');
    }
    template = template.replace('<script type="module"', `${mediaMapScript}\n    <script type="module"`);
  }

  // Same problem, same fix, for PartnerPage's settings-backed pricing:
  // client/src/lib/settings.ts statically imports settings-map.json, which
  // goes stale in the client bundle the moment a price changes through the
  // panel. scripts/generate-settings-map.ts always runs right before this
  // script, so its output here is as fresh as the DB.
  const settingsMapPath = path.join(ROOT, "client", "src", "generated", "settings-map.json");
  if (fs.existsSync(settingsMapPath)) {
    const settingsMap = JSON.parse(fs.readFileSync(settingsMapPath, "utf-8"));
    const settingsMapScript = `<script>window.__SETTINGS_MAP__ = ${JSON.stringify(settingsMap).replace(/</g, "\\u003c")};</script>`;
    if (!template.includes('<script type="module"')) {
      throw new Error('Expected a <script type="module"> tag in the cached template to inject window.__SETTINGS_MAP__ before.');
    }
    template = template.replace('<script type="module"', `${settingsMapScript}\n    <script type="module"`);
  }

  for (const route of routes) {
    const { html, head, canonicalHref } = render(route);
    const headTags = [
      `<title>${escapeHtml(head.title)}</title>`,
      `<meta name="description" content="${escapeHtml(head.description)}" />`,
      `<meta property="og:site_name" content="${escapeHtml(SITE.name)}" />`,
      `<meta property="og:title" content="${escapeHtml(head.title)}" />`,
      `<meta property="og:description" content="${escapeHtml(head.description)}" />`,
      `<meta property="og:url" content="${escapeHtml(canonicalHref)}" />`,
    ];
    // No og-image slot set: omit the tag rather than point social crawlers
    // at a URL that doesn't exist. "summary_large_image" needs an image to
    // render as intended, so the card type downgrades along with it.
    if (ogImageHref) headTags.push(`<meta property="og:image" content="${escapeHtml(ogImageHref)}" />`);
    headTags.push(
      `<meta name="twitter:card" content="${ogImageHref ? "summary_large_image" : "summary"}" />`,
      `<meta name="twitter:title" content="${escapeHtml(head.title)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(head.description)}" />`,
      `<link rel="canonical" href="${escapeHtml(canonicalHref)}" />`
    );
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

  // Same idea, one level up, for /signin /signup /chat /account —
  // account-management routes shown to signed-in visitors, not admin
  // staff, so a neutral title instead of "Panel". Also never in `routes`,
  // the sitemap, or robots.txt's Allow. server/index.ts serves this single
  // file for a direct hit on any of the four paths.
  const appShellHeadHtml = [`<title>${SITE.name}</title>`, `<meta name="robots" content="noindex, nofollow" />`].join(
    "\n    "
  );
  const appShell = template.replace("<!--app-html-->", "").replace("<!--app-head-->", appShellHeadHtml);
  fs.writeFileSync(path.join(DIST_DIR, "app-shell.html"), appShell, "utf-8");
  console.log("[prerender] wrote /app-shell.html (empty shell for /signin, /signup, /chat, /account)");

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
    ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /signin\nDisallow: /signup\nDisallow: /chat\nDisallow: /account\n\nSitemap: ${SITE.domain}/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\n`;
  fs.writeFileSync(path.join(DIST_DIR, "robots.txt"), robotsTxt, "utf-8");
  console.log(`[prerender] wrote /robots.txt (indexable: ${SITE.indexable})`);

  // Generated fresh every run, same as robots.txt/sitemap.xml above —
  // client/public/manifest.json no longer exists, so this is the only
  // source. Icons list is empty (not a broken reference) until icon-192/
  // icon-512 have something uploaded.
  const icon192Href = mediaMap["icon-192"]?.base;
  const icon512Href = mediaMap["icon-512"]?.base;
  const manifestIcons = [];
  if (icon192Href) manifestIcons.push({ src: icon192Href, sizes: "192x192", type: "image/png", purpose: "any" });
  if (icon512Href) {
    manifestIcons.push({ src: icon512Href, sizes: "512x512", type: "image/png", purpose: "any" });
    manifestIcons.push({ src: icon512Href, sizes: "512x512", type: "image/png", purpose: "maskable" });
  }
  const manifest = {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: MANIFEST_BACKGROUND_COLOR,
    theme_color: MANIFEST_THEME_COLOR,
    lang: "en",
    orientation: "portrait-primary",
    categories: ["education", "medical"],
    icons: manifestIcons,
  };
  fs.writeFileSync(path.join(DIST_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`[prerender] wrote /manifest.json (${manifestIcons.length} icon(s))`);

  fs.rmSync(SSR_TMP_DIR, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
