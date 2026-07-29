import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageSquare, SearchCheck, FileText } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Cuéntanos tu objetivo de investigación",
    description:
      "Nos escribes qué te interesa investigar — recuperación, longevidad, metabolismo, rendimiento — y por qué.",
  },
  {
    icon: SearchCheck,
    title: "Revisamos la literatura disponible",
    description:
      "Con ayuda de IA, buscamos y organizamos estudios publicados relevantes para ese objetivo: qué existe, en qué modelos y con qué nivel de evidencia.",
  },
  {
    icon: FileText,
    title: "Recibes un resumen educativo, no una receta",
    description:
      "Te devolvemos un panorama claro de lo que la evidencia dice y no dice. Nunca dosis, protocolos ni indicaciones de uso — eso es trabajo de un profesional de la salud.",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="como-funciona" className="py-24 px-4" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Cómo funciona</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tres pasos, siempre educativos. En ningún momento diagnosticamos, prescribimos ni
            recomendamos un uso específico.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="relative rounded-2xl bg-card border border-border p-8"
            >
              <span className="absolute -top-4 -left-2 font-display text-5xl font-bold text-primary/20">
                {i + 1}
              </span>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <step.icon className="w-5 h-5 text-dorado-texto" />
              </div>
              <h3 className="font-semibold text-lg mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
