import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getSlotUrl } from "@/lib/media";
import { ArrowRight, Sparkles } from "lucide-react";

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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-12 items-center">
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
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-background/15 bg-background/8 backdrop-blur-md text-xs font-medium text-background/85 mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered peptide research
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="text-[clamp(42px,6.4vw,78px)] font-bold mb-6 text-background"
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
              className="text-lg text-background/70 mb-10 max-w-lg"
            >
              Sunny organizes peptide research and explains the science in clear, accessible language.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Button size="lg" className="hero-cta-glow text-base font-semibold px-8 h-12 rounded-full">
                Start Exploring
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-base font-medium px-8 h-12 rounded-full border border-background/20 bg-background/8 backdrop-blur-md text-background hover:bg-background/14 hover:text-background"
                onClick={() => scrollToSection("compounds")}
              >
                Browse Compounds
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xs text-background/60 mt-8"
            >
              Educational research content. Not medical advice. For adults 21+.
            </motion.p>
          </motion.div>

          {/* RIGHT SIDE - HERO PORTRAIT */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="relative"
          >
            {/* width:100% + height:auto at the image's native 1200x600 ratio
                — never cropped, never given a fixed height. The frame's
                breathing aura (::before) and floating animation live in
                index.css (.hero-portrait-wrap / .hero-portrait-frame). */}
            <div className="hero-portrait-wrap">
              <div className="hero-portrait-frame">
                <img
                  src={getSlotUrl("hero-sunny")}
                  srcSet={`${getSlotUrl("hero-sunny")} 1200w${getSlotUrl("hero-sunny", "2x") ? `, ${getSlotUrl("hero-sunny", "2x")} 2400w` : ""}`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  width={1200}
                  height={600}
                  fetchPriority="high"
                  decoding="async"
                  alt="Sunny, the AI peptide research assistant"
                />
                <div className="absolute left-4 bottom-4 flex items-center gap-2 px-3 py-2 rounded-full bg-background/10 backdrop-blur-md border border-background/15 text-xs font-medium text-background">
                  <span className="pulse-dot" />
                  Sunny
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
