import SlotImage from "@/components/SlotImage";
import { SITE } from "@shared/site";

/**
 * El logo, en los siete sitios que lo pintan.
 *
 * Existe para que la política de "slot vacío" del logo se decida una sola
 * vez: si no hay imagen subida, se pinta el nombre de la marca como texto.
 * Devolver `null` dejaría la cabecera con un enlace invisible y el panel sin
 * identificación, así que este es el único slot del proyecto cuyo hueco se
 * rellena en vez de desaparecer.
 */
export default function Logo({
  className,
  wordmarkClassName,
  loading,
}: {
  className: string;
  /** Cómo se ve el texto cuando no hay logo subido. */
  wordmarkClassName: string;
  loading?: "lazy" | "eager";
}) {
  return (
    <SlotImage
      slot="logo"
      alt={SITE.name}
      width={886}
      height={300}
      className={className}
      loading={loading}
      fallback={<span className={wordmarkClassName}>{SITE.name}</span>}
    />
  );
}
