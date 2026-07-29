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
    return withNoindex({ title: `${NAME} — Consultora de péptidos con IA`, description: SITE.description, canonicalPath: "/" });
  }
  if (clean === "/contact") {
    return withNoindex({
      title: `Contacto — ${NAME}`,
      description: "Escríbenos para hablar de tu objetivo de investigación. Respuesta educativa, sin diagnóstico ni prescripción.",
      canonicalPath: "/contact",
    });
  }
  if (clean === "/blog") {
    return withNoindex({
      title: `Blog de ${NAME} — Investigación sobre péptidos`,
      description: "Artículos educativos sobre péptidos: qué dice la evidencia, qué no, y cómo leer el panorama de investigación.",
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
    return withNoindex({ title: `Términos de Servicio — ${NAME}`, description: `Términos y condiciones de uso de ${NAME}.`, canonicalPath: clean });
  }
  if (clean === "/legal/privacy") {
    return withNoindex({ title: `Política de Privacidad — ${NAME}`, description: `Cómo ${NAME} trata tus datos personales.`, canonicalPath: clean });
  }
  if (clean === "/legal/cookies") {
    return withNoindex({ title: `Política de Cookies — ${NAME}`, description: `Uso de cookies en ${NAME}.`, canonicalPath: clean });
  }
  if (clean === "/legal/disclaimer") {
    return withNoindex({ title: `Aviso Legal — ${NAME}`, description: `Aviso educativo y de investigación de ${NAME}.`, canonicalPath: clean });
  }

  return withNoindex({ title: `Página no encontrada — ${NAME}`, description: SITE.description, canonicalPath: clean, notFound: true });
}
