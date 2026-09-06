// Módulo único para el dominio y los datos del sitio. Todo lo que necesite el
// dominio final (canonical, sitemap, robots.txt, og tags, JSON-LD) importa de
// aquí — para cambiar de dominio basta con editar la línea de `domain`.
// Lynx's public embed key. Not a secret: it ships inside a <script> tag on
// every public page and in the data-api-key attribute of the /chat loader, so
// anyone can read it from view-source. It identifies which assistant to serve,
// it doesn't authorize anything — the private keys stay on Lynx's side.
const CHAT_WIDGET_KEY = "lx_d9bc4b4dded89638fd1ade26797509c4936fa6dd257117de";

export const SITE = {
  name: "Sunny",
  // TODO: reemplazar por el dominio definitivo cuando se confirme (hoy vive en un dominio temporal de Railway).
  domain: "https://sunny-ai-production.up.railway.app",
  description:
    "Sunny is an AI-powered peptide research consultancy: educational, research-focused information about compounds — no diagnosing, no prescribing.",
  // No fixed path here on purpose — scripts/prerender.mjs resolves
  // og:image from the "og-image" media slot instead, so it's never a file
  // baked into client/public.
  contactEmail: "hola@sunnypeptides.com",
  // false mientras el sitio viva en el dominio temporal de Railway: fuerza
  // robots.txt a "Disallow: /" y <meta name="robots" content="noindex"> en
  // todas las páginas. Cambiar a true (una sola línea) al pasar al dominio
  // definitivo.
  indexable: false,

  // The site's own language, as a BCP 47 tag. One source for the three
  // places that used to hardcode "en" independently: client/index.html's
  // <html lang>, manifest.json's lang (scripts/prerender.mjs) and the
  // WebSite JSON-LD. A blog post carries its own `lang` column, and
  // scripts/prerender.mjs overrides <html lang> for a post written in
  // anything other than this — a page that says "en" while its article is
  // in Spanish is a signal Google acts on, and acts on wrongly.
  lang: "en",

  // --- Lynx chat integration -------------------------------------------
  // Single place to change the embed. `chatWidgetSrc`/`chatWidgetKey` feed
  // the floating bubble that client/index.html injects on every public page
  // (scripts/prerender.mjs substitutes them into the template);
  // `chatPageLoaderSrc` feeds the full-page chat on /chat
  // (client/src/pages/ChatPage.tsx), which injects it as a <script> on mount
  // rather than hard-coding an iframe URL.
  chatWidgetKey: CHAT_WIDGET_KEY,
  chatWidgetSrc: "https://www.lynxaiassistant.com/api/widget.js",
  chatPageLoaderSrc: "https://www.lynxaiassistant.com/api/widget/page.js",
  // Spinner colour for the /chat loader, kept identical to
  // MANIFEST_THEME_COLOR in scripts/prerender.mjs so the page and the PWA
  // chrome agree. Note this is no longer the assistant's `primaryColor` —
  // GET /api/widget/config now returns #000000 for it, so prerender.mjs's
  // comment claiming the two track each other is out of date.
  chatAccent: "#403911",

  // Paths (and their subtrees) where the floating bubble must never appear.
  // /admin is staff-only and /signin, /signup, /account are transactional —
  // a sales-y chat bubble on top of a password field is noise. /chat is on
  // the list for the opposite reason: the whole page IS the chat, so a
  // bubble there would open a second, duplicate conversation over it.
  // Read from two places, both driven by this array: the inline loader in
  // client/index.html and ChatWidgetRouteGate in client/src/App.tsx (which
  // catches client-side navigation, where no new document is ever served).
  chatWidgetHiddenRoutes: ["/admin", "/signin", "/signup", "/account", "/chat"],

  // Consent state shared between ConsentGate.tsx and the index.html loader —
  // the widget must not exist until the 21+ terms are accepted. Bump
  // `version` if the terms change; anyone who accepted an older one is asked
  // again (and the widget waits again along with it).
  consent: { storageKey: "sunny-consent", version: 1 },
} as const;

export function absoluteUrl(path: string): string {
  return `${SITE.domain}${path === "/" ? "" : path}`;
}
