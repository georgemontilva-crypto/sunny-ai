import type { ComponentProps, ReactNode } from "react";
import { getSlotUrl, type VariantName } from "@/lib/media";

type SlotImageProps = Omit<ComponentProps<"img">, "src" | "srcSet"> & {
  slot: string;
  /**
   * Descriptores de ancho por variante, p. ej. `{ base: 500, "2x": 1000 }`.
   * Una variante que no exista en el mapa se omite del srcset en vez de
   * generar una candidata rota, y si solo queda una no se emite srcset.
   */
  srcSetWidths?: Partial<Record<VariantName, number>>;
  /** Qué pintar cuando el slot está vacío. Por defecto, nada. */
  fallback?: ReactNode;
};

/**
 * La única forma de pintar un slot de medios.
 *
 * Existe porque `getSlotUrl` devuelve `undefined` para un slot sin imagen, y
 * un `<img src={undefined}>` no desaparece: React omite el atributo y el
 * navegador pinta el marco roto con el texto alternativo. Eso no es un caso
 * teórico. El mapa de medios se hornea en el bundle durante `vite build`, y
 * en Railway ese build NO alcanza la base de datos —comprobado: el chunk
 * desplegado no contiene ni una URL de R2—, así que cada despliegue arranca
 * con el mapa vacío hasta que el republish de server/republish.ts lo
 * regenera unos segundos después. Durante esa ventana TODOS los slots
 * resuelven a `undefined` a la vez.
 *
 * Antes eso significaba doce `<img>` sin src repartidos por la home, la
 * barra, el pie, el panel y las pantallas de acceso. Aquí la regla vive en
 * un sitio y no se puede saltar: sin URL no hay elemento.
 */
export default function SlotImage({ slot, srcSetWidths, fallback = null, ...imgProps }: SlotImageProps) {
  const src = getSlotUrl(slot);
  if (!src) return <>{fallback}</>;

  let srcSet: string | undefined;
  if (srcSetWidths) {
    const parts: string[] = [];
    for (const [variant, width] of Object.entries(srcSetWidths) as [VariantName, number][]) {
      const url = getSlotUrl(slot, variant);
      if (url) parts.push(`${url} ${width}w`);
    }
    // Un srcset de una sola candidata no aporta nada sobre src.
    if (parts.length > 1) srcSet = parts.join(", ");
  }

  return <img src={src} srcSet={srcSet} {...imgProps} />;
}
