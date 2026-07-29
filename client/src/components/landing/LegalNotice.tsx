import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle } from "lucide-react";

export default function LegalNotice() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-16 px-4" ref={ref}>
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="dorado-filo rounded-2xl p-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-dorado-texto" />
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-3">Aviso importante</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Todo el contenido de Sunny —biblioteca de compuestos, blog y respuestas del formulario de
                contacto— tiene <strong className="text-foreground">fines exclusivamente educativos y de
                investigación</strong>. Sunny <strong className="text-foreground">no ofrece consejo
                médico</strong>, no diagnostica ni prescribe ningún tratamiento, compuesto o protocolo.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Este sitio está dirigido a <strong className="text-foreground">personas mayores de 21
                años</strong>. Consulta siempre a un <strong className="text-foreground">profesional de la
                salud cualificado</strong> antes de tomar cualquier decisión relacionada con tu salud. Sunny
                no asume responsabilidad por decisiones tomadas a partir de este contenido.
              </p>
              <Link href="/legal/disclaimer" className="text-sm text-dorado-texto hover:underline font-medium">
                Leer el aviso legal completo →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
