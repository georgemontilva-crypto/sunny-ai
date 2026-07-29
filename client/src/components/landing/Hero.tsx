import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero-bg pt-40 pb-28 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-dorado-texto mb-6"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Investigación en péptidos, asistida por IA
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.05]"
      >
        Claridad, no ruido, sobre{" "}
        <span className="dorado-texto-gradiente">investigación en péptidos</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
      >
        Sunny organiza la literatura científica disponible sobre péptidos y te la explica en lenguaje
        claro. Sin humo, sin promesas — investigación, no prescripción.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Link href="/contact">
          <Button size="lg" className="text-base font-semibold px-8 h-12">
            Habla con Sunny
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Button
          size="lg"
          variant="outline"
          className="text-base font-medium px-8 h-12"
          onClick={() => document.getElementById("biblioteca")?.scrollIntoView({ behavior: "smooth" })}
        >
          Ver biblioteca de compuestos
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-xs text-muted-foreground mt-8"
      >
        Contenido educativo y de investigación. No es consejo médico. Mayores de 21 años.
      </motion.p>
    </section>
  );
}
