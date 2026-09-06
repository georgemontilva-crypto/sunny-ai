import { getPostBySlug, postImageUrl } from "./blog";
import { SITE, absoluteUrl } from "@shared/site";

export interface HeadMeta {
  title: string;
  description: string;
  canonicalPath: string;
  notFound?: boolean;
  noindex?: boolean;
  // This page's own language, as a BCP 47 tag. Always SITE.lang except on a
  // post written in something else, where scripts/prerender.mjs writes it
  // into <html lang>. Set unconditionally rather than only-when-different:
  // the value is simply "what language is this page", and when it matches
  // the site's the substitution is a no-op.
  lang?: string;
  // Defaults to "website" where absent; only an article says otherwise.
  ogType?: "website" | "article";
  // Overrides the global og-image slot for this page. `alt` is required
  // alongside it: an image in a share card with no alt is one more thing
  // that renders as a blank rectangle in a screen reader.
  image?: { url: string; alt: string };
  // og/article:* timestamps, ISO 8601. Only /blog/:slug sets these.
  article?: { publishedTime: string; modifiedTime: string; section?: string };
}

const NAME = SITE.name;

export function canonicalUrl(path: string): string {
  return absoluteUrl(path);
}

function withNoindex(meta: Omit<HeadMeta, "noindex">): HeadMeta {
  // SITE.indexable is a global switch (off while the site lives on a
  // temporary Railway domain) — it always wins over per-route defaults.
  return { ...meta, noindex: !SITE.indexable || meta.notFound === true };
}

const ADMIN_LABELS: Record<string, string> = {
  "/admin/login": "Sign in",
  "/admin/requests": "Requests",
  "/admin/media": "Media",
  "/admin/blog": "Blog",
  "/admin/settings": "Settings",
  "/admin/users": "Users",
  "/admin/audit": "Audit log",
};

export function getMetaForPath(path: string): HeadMeta {
  const clean = path.replace(/\/+$/, "") || "/";

  // The admin panel is never indexed, regardless of SITE.indexable — unlike
  // withNoindex()'s per-route defaults, this doesn't flip once the site goes
  // public.
  if (clean === "/admin" || clean.startsWith("/admin/")) {
    const label = ADMIN_LABELS[clean] ?? "Panel";
    return {
      title: `${label} — Panel — ${NAME}`,
      description: `${NAME} admin panel.`,
      canonicalPath: clean,
      noindex: true,
    };
  }

  // /chat is publicly reachable (no MemberGuarded — see App.tsx), but it's
  // still never indexed: the page is a full-screen iframe of Lynx's chat,
  // so there is no content of ours on it for a crawler to rank, and it's
  // deliberately absent from both the sitemap and scripts/prerender.mjs's
  // route list. Unlike the member pages below it gets a real description —
  // it's a page we link to from the navbar and from three CTAs, so it can
  // legitimately end up in a share preview.
  if (clean === "/chat") {
    return {
      title: `Chat — ${NAME}`,
      description:
        "Ask Sunny about peptide research and get educational summaries of what the literature says. Not medical advice. Adults 21+.",
      canonicalPath: "/chat",
      noindex: true,
    };
  }

  // Member account pages, same reasoning as /admin above: never indexed,
  // regardless of SITE.indexable, and not part of withNoindex()'s per-route
  // defaults that flip once the site goes public.
  if (clean === "/signin" || clean === "/signup" || clean === "/account") {
    // Noindex, so these descriptions are never a search snippet — they're
    // still distinct because they're also what a link preview shows when
    // someone pastes one of these URLs into a chat.
    const meta: Record<string, { label: string; description: string }> = {
      "/signin": { label: "Sign in", description: `Sign in to your ${NAME} account.` },
      "/signup": { label: "Create account", description: `Create a ${NAME} account to keep your chat history.` },
      "/account": { label: "Account", description: `Manage your ${NAME} account and your chat history.` },
    };
    return {
      title: `${meta[clean].label} — ${NAME}`,
      description: meta[clean].description,
      canonicalPath: clean,
      noindex: true,
    };
  }

  if (clean === "/") {
    return withNoindex({ title: `${NAME} — AI Peptide Research`, description: SITE.description, canonicalPath: "/" });
  }
  if (clean === "/partner") {
    return withNoindex({
      title: `Sunny for Brands — Research assistant for peptide catalogs`,
      description:
        "Sunny reads the literature on your catalog and explains it in your brand's voice — without dosing, protocols, or diagnosis. Embedded or fully white-labeled.",
      canonicalPath: "/partner",
    });
  }
  if (clean === "/contact") {
    return withNoindex({
      title: `Contact — ${NAME}`,
      description: "Tell us about your research goal. Educational response, no diagnosis or prescription.",
      canonicalPath: "/contact",
    });
  }
  if (clean === "/blog") {
    return withNoindex({
      title: `${NAME} Blog — Peptide Research`,
      description: "Educational articles about peptides: what the evidence says, what it doesn't, and how to read the research landscape.",
      canonicalPath: "/blog",
    });
  }
  const blogMatch = clean.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const post = getPostBySlug(blogMatch[1]);
    if (!post) return withNoindex({ title: NAME, description: SITE.description, canonicalPath: clean, notFound: true });
    // metaTitle/metaDescription are the author's overrides from
    // /admin/blog. When set they're used verbatim — no " · Sunny" suffix
    // appended to a title someone deliberately wrote to fit in 60
    // characters. Empty falls back to the post's own title/excerpt.
    const image = postImageUrl(post);
    return withNoindex({
      title: post.metaTitle || `${post.title} · ${NAME}`,
      description: post.metaDescription || post.excerpt || SITE.description,
      canonicalPath: clean,
      lang: post.lang,
      ogType: "article",
      // The cover is decorative on the page itself (the <h1> says the same
      // thing right next to it, so BlogPostPage renders it with alt=""),
      // but a share card is often shown with no title beside it — there,
      // the article's title is what the image is actually of.
      ...(image ? { image: { url: image, alt: post.title } } : {}),
      article: {
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt || post.publishedAt,
        ...(post.category ? { section: post.category } : {}),
      },
    });
  }
  // Each of the four legal pages describes what *that* document actually
  // says. They used to be one-line variations on "legal page for Sunny",
  // which is the shape of description Google drops in favour of a snippet it
  // picks itself — and four near-identical ones read as boilerplate.
  if (clean === "/legal/terms") {
    return withNoindex({
      title: `Terms of Service — ${NAME}`,
      description:
        "The terms governing use of the Sunny website: what the service is, what it explicitly isn't, account rules, and the limits of our liability.",
      canonicalPath: clean,
    });
  }
  if (clean === "/legal/privacy") {
    return withNoindex({
      title: `Privacy Policy — ${NAME}`,
      description:
        "What data Sunny collects through this site and through an account, what we do with it, how long we keep it, and how to have it deleted.",
      canonicalPath: clean,
    });
  }
  if (clean === "/legal/cookies") {
    return withNoindex({
      title: `Cookie Policy — ${NAME}`,
      description:
        "Sunny sets one cookie, to keep you signed in if you have an account. No advertising cookies and no third-party tracking — here's the detail.",
      canonicalPath: clean,
    });
  }
  if (clean === "/legal/disclaimer") {
    return withNoindex({
      title: `Legal Disclaimer — ${NAME}`,
      description:
        "Everything Sunny publishes is educational and research content. No diagnosis, no prescription, no dosing — and nothing here replaces a qualified professional.",
      canonicalPath: clean,
    });
  }

  return withNoindex({ title: `Page not found — ${NAME}`, description: SITE.description, canonicalPath: clean, notFound: true });
}
