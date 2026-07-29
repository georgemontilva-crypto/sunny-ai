import { SITE, absoluteUrl } from "@shared/site";

export default function SchemaMarkup() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.domain,
    logo: absoluteUrl("/icon-512x512.png"),
    description: SITE.description,
    email: SITE.contactEmail,
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD from our own static SITE config — not user input, safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
