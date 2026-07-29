import { getPostBySlug } from "./blog";

export interface HeadMeta {
  title: string;
  description: string;
  canonicalPath: string;
  notFound?: boolean;
}

const SITE = "Sunny";
const CANONICAL_ORIGIN = "https://sunnypeptides.com";
const DEFAULT_DESC =
  "Sunny es una consultora de péptidos con IA: información educativa y de investigación sobre compuestos, sin diagnosticar ni prescribir.";

export function canonicalUrl(path: string): string {
  return `${CANONICAL_ORIGIN}${path}`;
}

export function getMetaForPath(path: string): HeadMeta {
  const clean = path.replace(/\/+$/, "") || "/";

  if (clean === "/") {
    return { title: `${SITE} — Consultora de péptidos con IA`, description: DEFAULT_DESC, canonicalPath: "/" };
  }
  if (clean === "/contact") {
    return {
      title: `Contacto — ${SITE}`,
      description: "Escríbenos para hablar de tu objetivo de investigación. Respuesta educativa, sin diagnóstico ni prescripción.",
      canonicalPath: "/contact",
    };
  }
  if (clean === "/blog") {
    return {
      title: `Blog de ${SITE} — Investigación sobre péptidos`,
      description: "Artículos educativos sobre péptidos: qué dice la evidencia, qué no, y cómo leer el panorama de investigación.",
      canonicalPath: "/blog",
    };
  }
  const blogMatch = clean.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const post = getPostBySlug(blogMatch[1]);
    if (!post) return { title: SITE, description: DEFAULT_DESC, canonicalPath: clean, notFound: true };
    return {
      title: `${post.meta.title} · ${SITE}`,
      description: post.meta.description,
      canonicalPath: clean,
    };
  }
  if (clean === "/legal/terms") {
    return { title: `Términos de Servicio — ${SITE}`, description: `Términos y condiciones de uso de ${SITE}.`, canonicalPath: clean };
  }
  if (clean === "/legal/privacy") {
    return { title: `Política de Privacidad — ${SITE}`, description: `Cómo ${SITE} trata tus datos personales.`, canonicalPath: clean };
  }
  if (clean === "/legal/cookies") {
    return { title: `Política de Cookies — ${SITE}`, description: `Uso de cookies en ${SITE}.`, canonicalPath: clean };
  }
  if (clean === "/legal/disclaimer") {
    return { title: `Aviso Legal — ${SITE}`, description: `Aviso educativo y de investigación de ${SITE}.`, canonicalPath: clean };
  }

  return { title: `Página no encontrada — ${SITE}`, description: DEFAULT_DESC, canonicalPath: clean, notFound: true };
}
