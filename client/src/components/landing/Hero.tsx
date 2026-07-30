import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import ParticleBackground from "./ParticleBackground";

export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className="pt-32 pb-16 md:pb-32 px-4 min-h-screen flex items-end md:items-center justify-center relative overflow-hidden"
      id="hero"
    >
      {/* 1. Background photo */}
      <div className="absolute inset-0 z-0">
        <picture className="block w-full h-full">
          <source media="(max-width: 768px)" srcSet="/hero-bg-mobile.webp" />
          <source srcSet="/hero-bg.webp 1600w, /hero-bg@2x.webp 2560w" sizes="100vw" />
          <img
            src="/hero-bg.webp"
            alt=""
            className="w-full h-full object-cover object-right"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </div>

      {/* 2. Cream fade — horizontal on desktop (text sits left), vertical on
          mobile (text sits at the bottom); a purely horizontal fade on
          narrow screens would leave the headline sitting on the model's face. */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none hidden md:block bg-gradient-to-r from-background from-0% via-background/92 via-45% to-background/10 to-100%"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-[1] pointer-events-none block md:hidden bg-gradient-to-b from-transparent from-0% to-background/95 to-100%"
        aria-hidden="true"
      />

      {/* 3. Particles, above the photo/gradient, below the copy */}
      <div className="absolute inset-0 z-[2]">
        <ParticleBackground />
      </div>

      {/* 4. Content */}
      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered peptide research
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-[1.05]"
          >
            Clarity on{" "}
            <span className="bg-gradient-to-r from-accent via-accent/80 to-accent/60 bg-clip-text text-transparent">
              peptide research
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="text-lg text-muted-foreground mb-10 max-w-lg"
          >
            Sunny organizes scientific literature on peptides and explains it in clear language. Research-backed, judgment-free, and always educational.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col sm:flex-row items-start gap-4"
          >
            <Button size="lg" className="text-base font-semibold px-8 h-12">
              Start Exploring
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base font-medium px-8 h-12"
              onClick={() => scrollToSection("compounds")}
            >
              Browse Compounds
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-xs text-muted-foreground mt-8"
          >
            Educational research content. Not medical advice. For adults 21+.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
