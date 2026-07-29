// Módulo único para el dominio y los datos del sitio. Todo lo que necesite el
// dominio final (canonical, sitemap, robots.txt, og tags, JSON-LD) importa de
// aquí — para cambiar de dominio basta con editar la línea de `domain`.
export const SITE = {
  name: "Sunny",
  // TODO: reemplazar por el dominio definitivo cuando se confirme (hoy vive en un dominio temporal de Railway).
  domain: "https://sunny.up.railway.app",
  description:
    "Sunny es una consultora de péptidos con IA: información educativa y de investigación sobre compuestos, sin diagnosticar ni prescribir.",
  ogImage: "/og-image.png",
  contactEmail: "hola@sunnypeptides.com",
  // false mientras el sitio viva en el dominio temporal de Railway: fuerza
  // robots.txt a "Disallow: /" y <meta name="robots" content="noindex"> en
  // todas las páginas. Cambiar a true (una sola línea) al pasar al dominio
  // definitivo.
  indexable: false,
} as const;

export function absoluteUrl(path: string): string {
  return `${SITE.domain}${path === "/" ? "" : path}`;
}
