import { getPostBySlug } from "./blog";
import { SITE, absoluteUrl } from "@shared/site";

export interface HeadMeta {
  title: string;
  description: string;
  canonicalPath: string;
  notFound?: boolean;
  noindex?: boolean;
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

export function getMetaForPath(path: string): HeadMeta {
  const clean = path.replace(/\/+$/, "") || "/";

  if (clean === "/") {
    return withNoindex({ title: `${NAME} — AI Peptide Research`, description: SITE.description, canonicalPath: "/" });
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
    return withNoindex({
      title: `${post.meta.title} · ${NAME}`,
      description: post.meta.description,
      canonicalPath: clean,
    });
  }
  if (clean === "/legal/terms") {
    return withNoindex({ title: `Terms of Service — ${NAME}`, description: `Terms and conditions of use for ${NAME}.`, canonicalPath: clean });
  }
  if (clean === "/legal/privacy") {
    return withNoindex({ title: `Privacy Policy — ${NAME}`, description: `How ${NAME} handles your personal data.`, canonicalPath: clean });
  }
  if (clean === "/legal/cookies") {
    return withNoindex({ title: `Cookie Policy — ${NAME}`, description: `Cookie usage on ${NAME}.`, canonicalPath: clean });
  }
  if (clean === "/legal/disclaimer") {
    return withNoindex({ title: `Legal Disclaimer — ${NAME}`, description: `Educational and research disclaimer for ${NAME}.`, canonicalPath: clean });
  }

  return withNoindex({ title: `Page not found — ${NAME}`, description: SITE.description, canonicalPath: clean, notFound: true });
}
