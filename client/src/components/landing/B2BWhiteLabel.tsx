import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Boxes, Code2, Palette, ShieldCheck } from "lucide-react";

const embedCapabilities = [
  "Embeddable widget to bring the compound library into your site or app.",
  "API to query research summaries from your own interface.",
  "Content stays educational — your team keeps control of any clinical recommendation.",
];

const whiteLabelCapabilities = [
  "Your brand, domain, and visual identity — powered by Sunny's research technology.",
  "The same editorial standards apply: conditional language, no dosing or protocols, and a legal notice that remains visible.",
  "Built for clinics, supplement brands, and wellness platforms.",
];

const partnerBenefits = [
  { icon: Boxes, title: "Trained on your catalog", subtext: "Indexed using your product data" },
  { icon: Palette, title: "Your brand, your domain", subtext: "Fully white-labeled" },
  { icon: ShieldCheck, title: "Guardrails built in", subtext: "No dosing, no protocols, no diagnosis" },
];

export default function B2BWhiteLabel() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="white-label" className="py-24 px-4 bg-secondary/30 scroll-mt-24" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            For clinics & brands: embed or white-label
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bring clear, research-focused education into your digital experience. Sunny can be adapted to
            your brand while maintaining transparent citations, careful language, and visible educational
            boundaries.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
            If you already work with patients or clients interested in peptides, you can offer them the
            same educational content from within your own platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 h-full">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <Code2 className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Embed</h3>
              <ul className="space-y-2.5">
                {embedCapabilities.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                    <span className="text-accent mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-8 h-full">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <Palette className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-3">White-Label</h3>
              <ul className="space-y-2.5">
                {whiteLabelCapabilities.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                    <span className="text-accent mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-8">
            <div className="text-xs text-muted-foreground mb-6 text-center">What partners get</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {partnerBenefits.map((benefit, i) => (
                <motion.div
                  key={benefit.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={shouldReduceMotion || isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.5, delay: i * 0.12, ease: "easeOut" }
                  }
                  className="group flex flex-col items-center text-center"
                >
                  <motion.div
                    animate={shouldReduceMotion ? {} : { y: [0, -4, 0] }}
                    transition={
                      shouldReduceMotion
                        ? {}
                        : { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }
                    }
                    className="mb-4"
                  >
                    <div className="w-[72px] h-[72px] rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center transition-colors duration-200 group-hover:bg-accent/20">
                      <benefit.icon
                        className="w-10 h-10 text-accent transition-transform duration-200 group-hover:scale-[1.08]"
                        strokeWidth={1.5}
                      />
                    </div>
                  </motion.div>
                  <p className="text-2xl font-bold text-accent mb-1">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.subtext}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
