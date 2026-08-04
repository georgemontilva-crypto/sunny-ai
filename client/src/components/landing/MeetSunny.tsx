import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { getSlotDef } from "@server/mediaCatalog.ts";
import { Button } from "@/components/ui/button";
import { getSlotUrl } from "@/lib/media";

const features = [
  {
    title: "Plain-language questions",
    description: "Ask about compounds and topics in your own words",
  },
  {
    title: "Citations included",
    description: "Every summary points back to published work",
  },
  {
    title: "Literature review",
    description: "Published research organized around your question",
  },
  {
    title: "Research context",
    description: "What the evidence shows, and where it stops",
  },
];

export default function MeetSunny() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const meetSunnyUrl = getSlotUrl("meet-sunny");
  const meetSunny2xUrl = getSlotUrl("meet-sunny", "2x");
  const meetSunnyRecommended = getSlotDef("meet-sunny")?.variants.base?.recommended;

  return (
    <section className="py-24 px-4 bg-secondary/34" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <div
          className="grid grid-cols-1 [grid-template-columns:1.05fr_0.95fr] max-[900px]:grid-cols-1 items-center"
          style={{ gap: "clamp(28px, 5vw, 64px)" }}
        >
          {/* LEFT SIDE - TEXT CONTENT */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-accent mb-6"
            >
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              YOUR AI CONSULTANT
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="text-[clamp(34px,4.6vw,56px)] font-semibold mb-[19px]"
            >
              Meet{" "}
              <span className="bg-gradient-to-r from-accent via-accent/80 to-accent/60 bg-clip-text text-transparent">
                Sunny
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="text-[16.5px] text-muted-foreground max-w-[46ch]"
            >
              Sunny is an AI-powered research assistant designed to make peptide literature easier to
              understand. Ask questions in plain language, explore published findings, and review citations,
              limitations, and research context — all in one place.
            </motion.p>

            {/* CAPABILITIES — a list of filete rows instead of icon cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="mt-[30px] border-t border-border"
            >
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                  className="grid grid-cols-[26px_1fr] gap-3.5 items-baseline py-[15px] border-b border-border transition-[padding-left] duration-[350ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:pl-2"
                >
                  <span className="font-mono text-[11px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <strong className="block text-[15.5px] font-semibold mb-0.5">{feature.title}</strong>
                    <span className="block text-sm text-muted-foreground">{feature.description}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="mt-8"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button size="lg" className="hero-cta-glow text-base font-semibold px-8 h-12 rounded-full">
                  Ask a Research Question
                </Button>
                <Button size="lg" variant="outline" className="text-base font-medium px-8 h-12 rounded-full">
                  Learn More
                </Button>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE - PORTRAIT */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="relative"
          >
            <div className="relative rounded-[calc(var(--radius)+6px)] overflow-hidden border border-border shadow-[0_34px_70px_-40px_rgba(120,80,20,0.6)]">
              <span
                className="meetsunny-halo absolute -z-10 rounded-full"
                style={{ inset: "-10%" }}
                aria-hidden="true"
              />
              {meetSunnyUrl ? (
                <img
                  src={meetSunnyUrl}
                  srcSet={meetSunny2xUrl ? `${meetSunnyUrl} 800w, ${meetSunny2xUrl} 1600w` : undefined}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  width={800}
                  height={1000}
                  loading="lazy"
                  decoding="async"
                  alt="Sunny, the AI peptide research assistant"
                  className="block w-full h-auto"
                />
              ) : (
                <div className="bg-gradient-to-br from-accent/20 via-accent/10 to-secondary w-full aspect-[4/5] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-accent/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-5xl">✨</span>
                    </div>
                    {meetSunnyRecommended && (
                      <div className="font-bold text-lg">
                        {meetSunnyRecommended.width} × {meetSunnyRecommended.height}
                      </div>
                    )}
                    <div className="text-sm mt-2">Sunny Profile Image</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
