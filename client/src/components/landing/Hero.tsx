import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="hero-gradient pt-40 pb-28 px-4 text-center min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
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
        className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.05]"
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
        className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
      >
        Sunny organizes scientific literature on peptides and explains it in clear language. Research-backed, judgment-free, and always educational.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
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

      {/* HERO BANNER IMAGE PLACEHOLDER - 1200x600px */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-4xl mx-auto mt-16 rounded-2xl overflow-hidden shadow-lg"
      >
        <div className="bg-gray-300 w-full h-96 flex items-center justify-center text-gray-600 text-sm font-medium">
          <div className="text-center">
            <div className="text-lg font-bold mb-2">Image Placeholder</div>
            <div>1200 × 600px</div>
            <div className="text-xs mt-1">Replace with R2 URL: hero-banner.jpg</div>
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-xs text-muted-foreground mt-12"
      >
        Educational research content. Not medical advice. For adults 21+.
      </motion.p>
    </section>
  );
}
