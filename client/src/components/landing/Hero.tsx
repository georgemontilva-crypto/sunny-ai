import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import HeroCarousel from "@/components/landing/HeroCarousel";

const EASE = [0.23, 1, 0.32, 1] as const;

export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className="pt-40 pb-16 md:pb-32 px-4 min-h-screen flex items-center justify-center relative overflow-hidden scroll-mt-24 bg-noche"
      id="hero"
    >
      {/* Background: three drifting radial gold light layers + a grain layer
          to keep the gradients from banding — replaces the old hero-bg photo
          entirely (the media slot itself is untouched, just unused here). */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="hero-light hero-light-1" />
        <div className="hero-light hero-light-2" />
        <div className="hero-light hero-light-3" />
        <div className="hero-grain" />
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl relative z-10">
        <div
          className="grid grid-cols-1 min-[940px]:grid-cols-[.86fr_1.14fr] items-center"
          style={{ gap: "clamp(26px, 4vw, 48px)" }}
        >
          {/* LEFT SIDE - TEXT CONTENT */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-background/16 bg-background/9 backdrop-blur-md text-xs font-medium text-accent mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered peptide research
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="text-[clamp(42px,6.4vw,78px)] font-semibold mb-6 max-w-[13ch] text-background"
            >
              Peptide Research,{" "}
              <span className="bg-gradient-to-r from-accent via-accent/80 to-accent/60 bg-clip-text text-transparent">
                Made Clear
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
              className="text-[clamp(16px,1.7vw,19px)] text-background/68 mb-10 max-w-[42ch]"
            >
              Sunny organizes peptide research and explains the science in clear, accessible language.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
              className="flex flex-col sm:flex-row items-start gap-3"
            >
              <Button size="lg" className="hero-cta-glow text-base font-semibold px-8 h-12 rounded-full">
                Start Exploring
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-base font-medium px-8 h-12 rounded-full border border-background/18 bg-background/7 backdrop-blur-md text-background hover:bg-background/14 hover:text-background"
                onClick={() => scrollToSection("compounds")}
              >
                Browse Compounds
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-[12.5px] text-background/40 mt-8"
            >
              Educational research content. Not medical advice. For adults 21+.
            </motion.p>
          </motion.div>

          {/* RIGHT SIDE - HERO CAROUSEL */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="relative"
          >
            <HeroCarousel />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
