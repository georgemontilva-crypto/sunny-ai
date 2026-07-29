import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "¿Sunny vende o distribuye péptidos?",
    a: "No. Sunny no vende, fabrica ni distribuye ningún compuesto. Publicamos resúmenes educativos de literatura científica disponible, nada más.",
  },
  {
    q: "¿Esto es consejo médico?",
    a: "No. Nada de lo que publicamos diagnostica, trata ni prescribe. Es contenido educativo y de investigación — cualquier decisión sobre tu salud debe pasar por un profesional cualificado.",
  },
  {
    q: "¿Por qué no incluyen dosis ni protocolos?",
    a: "Porque no es información que nos corresponda dar. La dosificación es una decisión clínica que depende de cada persona, y solo un profesional de la salud puede evaluarla con criterio.",
  },
  {
    q: "¿Cómo deciden qué compuestos incluir en la biblioteca?",
    a: "Priorizamos compuestos con literatura científica publicada y verificable — preclínica o clínica — y lo dejamos explícito en cada ficha. Si la evidencia es débil o inexistente, lo decimos.",
  },
  {
    q: "¿Ofrecen integración para clínicas o marcas?",
    a: "Sí, mediante embed o white-label. Revisa la sección para clínicas y marcas más arriba, o escríbenos desde el formulario de contacto.",
  },
];

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-4" ref={ref}>
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Preguntas frecuentes</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
