import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain } from "lucide-react";
import ParticleBackground from "./ParticleBackground";

export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="hero-gradient pt-32 pb-32 px-4 min-h-screen flex items-center justify-center relative overflow-hidden" id="hero">
      <ParticleBackground />
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* LEFT SIDE - TEXT CONTENT */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="text-left"
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

          {/* RIGHT SIDE - HERO IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="relative h-96 lg:h-full min-h-96"
          >
            {/* HERO BANNER IMAGE PLACEHOLDER - 1200x600px */}
            <div className="bg-gradient-to-br from-gray-300 to-gray-400 w-full h-full rounded-2xl flex items-center justify-center text-gray-600 shadow-2xl overflow-hidden">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-center"
              >
                <Brain className="w-24 h-24 mx-auto mb-4 opacity-60" />
                <div className="font-bold text-lg">1200 × 600px</div>
                <div className="text-sm mt-2">Hero Banner Image</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
