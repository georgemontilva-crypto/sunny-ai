import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import SectionHead from "@/components/landing/SectionHead";
import { compoundLibrary } from "@/lib/compoundLibrary";
import { getSlotUrl } from "@/lib/media";

export default function Compounds() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [featured, ...rest] = compoundLibrary;

  return (
    <section id="compounds" className="py-24 px-4 bg-secondary/30 scroll-mt-24" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <SectionHead eyebrow="Research summaries" title="Compound" accentTitle="Library" note="Not medical advice." />

        <p className="text-sm text-muted-foreground max-w-2xl -mt-6 mb-10">
          Research summaries in conditional language. The information provided here is strictly educational.
          Sunny does not provide dosing instructions, protocols, medical claims, or recommendations for human
          use.
        </p>

        {/* Featured compound */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-[minmax(280px,38%)_1fr] max-[800px]:grid-cols-1 bg-card border border-border rounded-2xl overflow-hidden mb-6"
        >
          <div className="p-6 flex items-center bg-secondary/20">
            <img
              src={getSlotUrl(featured.image)}
              width={350}
              height={140}
              loading="lazy"
              decoding="async"
              alt={`${featured.name} research-grade vial`}
              className="w-full h-auto rounded-xl"
            />
          </div>
          <div className="py-[30px] px-8 flex flex-col justify-center">
            <p className="font-mono text-[11px] tracking-[.1em] uppercase text-muted-foreground mb-2">
              {featured.category}
            </p>
            <h3 className="text-[30px] font-semibold mb-3">{featured.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[56ch] mb-5">
              {featured.description}
            </p>
            {featured.evidenceTags && featured.evidenceTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {featured.evidenceTags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10.5px] tracking-wide uppercase px-2.5 py-1 rounded-full border border-border text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Remaining compounds — items-start so a longer description on one
            card never stretches the others to match its height. */}
        <div className="grid grid-cols-4 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1 gap-6 items-start">
          {rest.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-18px_rgba(200,150,80,0.4)]"
            >
              <img
                src={getSlotUrl(c.image)}
                width={350}
                height={140}
                loading="lazy"
                decoding="async"
                alt={`${c.name} research-grade vial`}
                className="w-full h-auto"
              />
              <div className="pt-4 px-[18px] pb-5">
                <p className="font-mono text-[10.5px] tracking-[.1em] uppercase text-muted-foreground mb-1.5">
                  {c.category}
                </p>
                <h3 className="text-lg font-semibold mb-1.5">{c.name}</h3>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">{c.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
