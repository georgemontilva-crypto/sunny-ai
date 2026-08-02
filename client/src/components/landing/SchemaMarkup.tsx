import { getSlotUrl } from "@/lib/media";
import { SITE, absoluteUrl } from "@shared/site";

export default function SchemaMarkup() {
  // getSlotUrl only ever returns an already-absolute R2 URL or undefined
  // (client/public is no longer a fallback source) — absoluteUrl() is only
  // needed as a defensive no-op if that ever changes; guards against
  // double-prefixing SITE.domain onto an already-absolute URL.
  const logoUrl = getSlotUrl("logo");

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.domain,
    description: SITE.description,
    email: SITE.contactEmail,
  };
  // No logo uploaded yet: omit the field rather than point it at a slot
  // with nothing in it.
  if (logoUrl) {
    schema.logo = logoUrl.startsWith("http") ? logoUrl : absoluteUrl(logoUrl);
  }

  return (
    <script
      type="application/ld+json"
      // JSON-LD from our own static SITE config — not user input, safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
