import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { compoundLibrary as compounds } from "@/lib/compoundLibrary";
import { getSlotUrl } from "@/lib/media";

export default function Compounds() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="compounds" className="py-24 px-4 bg-secondary/30 scroll-mt-24" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Compound Library
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Research summaries in conditional language. The information provided here is strictly educational. Sunny does not provide dosing instructions, protocols, medical claims, or recommendations for human use.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Educational summaries of published research. Not medical advice.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6">
          {compounds.map((c, i) => (
            <motion.div
              key={c.name}
              className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
            >
              <Card className="p-6 h-full flex flex-col hover:shadow-md transition-shadow overflow-hidden">
                <div className="w-full h-32 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={getSlotUrl(c.image)}
                    width={350}
                    height={140}
                    loading="lazy"
                    decoding="async"
                    alt={`${c.name} research-grade vial`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-lg">{c.name}</h3>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {c.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
