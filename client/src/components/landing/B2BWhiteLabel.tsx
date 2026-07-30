import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Code2, Palette } from "lucide-react";

const embedCapabilities = [
  "Embeddable widget to bring the compound library into your site or app.",
  "API to query research summaries from your own interface.",
  "Content stays educational — your team keeps control of any clinical recommendation.",
];

const whiteLabelCapabilities = [
  "Your brand, your domain, your palette — Sunny's research engine underneath.",
  "Same editorial standard: conditional language, no dosing or protocols, legal notice always visible.",
  "Built for clinics, supplement brands, and wellness platforms.",
];

const partnerBenefits = [
  { title: "Trained on your catalog", subtext: "Indexed from your own product data" },
  { title: "Your brand, your domain", subtext: "Fully white-labeled" },
  { title: "Guardrails built in", subtext: "No dosing, no protocols, no diagnosis" },
];

export default function B2BWhiteLabel() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="white-label" className="py-24 px-4 bg-secondary/20" ref={ref}>
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
            <Card className="p-8 h-full border-accent/30">
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
          <Card className="p-8 bg-secondary/40">
            <div className="text-xs text-muted-foreground mb-6">What partners get</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {partnerBenefits.map((benefit) => (
                <div key={benefit.title}>
                  <p className="text-2xl font-bold text-accent mb-1">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.subtext}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
