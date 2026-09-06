// Every piece of structured data the site emits, built for one path at a
// time. Nothing here is hand-written duplicate content: the Organization
// comes from shared/site.ts, the FAQPage from the same lib/faq.ts array the
// accordion renders, the BlogPosting from the post row the page renders, and
// images from the media map. If a section changes, its structured data
// changes with it — which is the only way a rich result stays truthful.
//
// Emitted as a single @graph rather than several <script> blocks so the
// Organization can be defined once and referenced by @id from WebSite,
// BlogPosting.publisher and the breadcrumbs.
import { getPostBySlug, postImageUrl, type BlogPost } from "./blog";
import { FAQS, faqAnswerText } from "./faq";
import { getSlotUrl } from "./media";
import { SITE, absoluteUrl } from "@shared/site";

// Stable @ids so nodes can cross-reference instead of repeating themselves.
// The fragment form (#organization) is the schema.org convention for "a
// thing this page describes" as opposed to the page itself.
const ORGANIZATION_ID = `${SITE.domain}/#organization`;
const WEBSITE_ID = `${SITE.domain}/#website`;

type JsonLdNode = Record<string, unknown>;

function organizationNode(): JsonLdNode {
  const node: JsonLdNode = {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE.name,
    url: SITE.domain,
    description: SITE.description,
    email: SITE.contactEmail,
  };
  // getSlotUrl returns an already-absolute R2 URL or undefined — absoluteUrl
  // is a defensive no-op for the former. Nothing uploaded yet: omit the
  // field rather than point crawlers at a slot with nothing in it.
  const logoUrl = getSlotUrl("logo");
  if (logoUrl) node.logo = logoUrl.startsWith("http") ? logoUrl : absoluteUrl(logoUrl);
  return node;
}

function websiteNode(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE.domain,
    name: SITE.name,
    description: SITE.description,
    inLanguage: SITE.lang,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

// Google renders this one as an expandable block directly in the results,
// which is why the answers have to be the page's own answers verbatim —
// see the note at the top of lib/faq.ts.
function faqPageNode(): JsonLdNode {
  return {
    "@type": "FAQPage",
    "@id": `${SITE.domain}/#faq`,
    mainEntity: FAQS.map((entry) => ({
      "@type": "Question",
      name: entry.q,
      acceptedAnswer: { "@type": "Answer", text: faqAnswerText(entry) },
    })),
  };
}

function breadcrumbNode(trail: { name: string; path: string }[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

function blogPostingNode(post: BlogPost, canonicalPath: string): JsonLdNode {
  const url = absoluteUrl(canonicalPath);
  const node: JsonLdNode = {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || SITE.description,
    datePublished: post.publishedAt,
    // A post that has never been edited since publication reports its
    // publication date here rather than omitting the field — Google treats a
    // missing dateModified as "unknown", not as "same as published".
    dateModified: post.updatedAt || post.publishedAt,
    inLanguage: post.lang,
    url,
    // The article is the main thing this URL is about — without this, Google
    // can't tell whether the BlogPosting describes the page or is just
    // mentioned on it.
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    // The site is the author of record: posts are published under the
    // Sunny name, and posts.authorId is a panel account (an internal user
    // row), not a public byline we display anywhere on the article.
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };
  if (post.category) node.articleSection = post.category;
  const image = postImageUrl(post);
  if (image) node.image = image;
  return node;
}

// The nodes for one path, or an empty array for anything that shouldn't
// advertise itself to a crawler at all. Returning [] for noindex routes
// isn't just tidiness: structured data on a page Google is told not to index
// is at best ignored and at worst a mixed signal.
export function getJsonLdForPath(path: string): JsonLdNode[] {
  const clean = path.split("?")[0].replace(/\/+$/, "") || "/";

  // Deliberately NOT gated on SITE.indexable. That flag is a temporary
  // "we're still on a Railway subdomain" switch, and robots.txt plus the
  // per-page noindex already keep crawlers out while it's off — gating the
  // graph on it too would mean the structured data ships for the first time
  // on the day the site goes public, having never once been looked at.
  // Per-route exclusions below are a different thing entirely: those pages
  // stay out permanently.
  if (
    clean === "/admin" ||
    clean.startsWith("/admin/") ||
    clean === "/chat" ||
    clean === "/signin" ||
    clean === "/signup" ||
    clean === "/account"
  ) {
    return [];
  }

  if (clean === "/") {
    return [organizationNode(), websiteNode(), faqPageNode()];
  }

  if (clean === "/blog") {
    return [
      organizationNode(),
      breadcrumbNode([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
      ]),
    ];
  }

  const blogMatch = clean.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const post = getPostBySlug(blogMatch[1]);
    if (!post) return [];
    return [
      organizationNode(),
      blogPostingNode(post, clean),
      breadcrumbNode([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: post.title, path: clean },
      ]),
    ];
  }

  if (clean === "/partner") {
    return [
      organizationNode(),
      breadcrumbNode([
        { name: "Home", path: "/" },
        { name: "For clinics and brands", path: "/partner" },
      ]),
    ];
  }

  // /contact and the legal pages: the Organization, nothing invented on top
  // of it. A WebPage node repeating the title and description already in the
  // <head> tells a crawler nothing it doesn't have.
  if (clean === "/contact" || clean.startsWith("/legal/")) return [organizationNode()];

  // Everything left is a page that doesn't exist — the /404 route, the
  // /__not_found__ path scripts/prerender.mjs renders into 404.html, or a
  // typo. Listing the routes explicitly above rather than falling through to
  // a catch-all is what keeps the Organization off those: a 404 that
  // announces a company is describing a page that isn't there.
  return [];
}

// Serialized for a <script type="application/ld+json">. `<` is escaped so a
// "</script>" inside any value — post titles and excerpts come from the
// database — can't close the tag early.
export function serializeJsonLd(nodes: JsonLdNode[]): string | null {
  if (nodes.length === 0) return null;
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c");
}
