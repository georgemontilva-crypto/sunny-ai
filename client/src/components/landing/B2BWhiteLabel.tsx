import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Code2, Palette, ShieldCheck } from "lucide-react";

const embedCapabilities = [
  "Widget embebible para integrar la biblioteca de compuestos en tu sitio o app.",
  "API para consultar resúmenes de investigación desde tu propia interfaz.",
  "Contenido siempre educativo — tu equipo mantiene el control de cualquier recomendación clínica.",
];

const whiteLabelCapabilities = [
  "Tu marca, tu dominio, tu paleta — el motor de investigación de Sunny debajo.",
  "Mismo estándar editorial: condicional, sin dosis ni protocolos, siempre con aviso legal visible.",
  "Pensado para clínicas, marcas de suplementación y plataformas de bienestar.",
];

// Placeholders explícitos — sin datos reales todavía. No se rellenan con
// cifras estimadas ni de referencia; se reemplazan cuando existan métricas propias.
const stats = [
  { label: "Tiempo de respuesta de la API", value: "[MÉTRICA PENDIENTE]" },
  { label: "Clínicas y marcas integradas", value: "[MÉTRICA PENDIENTE]" },
  { label: "Consultas procesadas", value: "[MÉTRICA PENDIENTE]" },
];

export default function B2BWhiteLabel() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="white-label" className="py-24 px-4" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Para clínicas y marcas: embed o white-label
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Si ya atiendes pacientes o clientes interesados en péptidos, puedes ofrecerles el mismo
            contenido educativo de Sunny dentro de tu propia plataforma.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-2xl bg-card border border-border p-8"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
              <Code2 className="w-5 h-5 text-dorado-texto" />
            </div>
            <h3 className="font-semibold text-lg mb-3">Embed</h3>
            <ul className="space-y-2.5">
              {embedCapabilities.map((item) => (
                <li key={item} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-dorado-texto mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="dorado-filo rounded-2xl p-8"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
              <Palette className="w-5 h-5 text-dorado-texto" />
            </div>
            <h3 className="font-semibold text-lg mb-3">White-Label</h3>
            <ul className="space-y-2.5">
              {whiteLabelCapabilities.map((item) => (
                <li key={item} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-dorado-texto mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl bg-muted/60 border border-border p-8"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            Cifras propias de Sunny, pendientes de publicar — no son estimaciones de terceros.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-bold text-muted-foreground mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
