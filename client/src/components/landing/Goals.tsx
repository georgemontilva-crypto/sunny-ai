import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import SectionHead from "@/components/landing/SectionHead";
import { getSlotUrl } from "@/lib/media";

const goals = [
  {
    title: "Recovery & Tissue Research",
    metric: "Tissue repair",
    label: "area of interest",
    description: "Explore published research related to tissue repair, recovery, and post-exercise adaptation.",
    compounds: ["BPC-157", "TB-500", "GHK-Cu"],
    image: "goal-recovery",
  },
  {
    title: "Metabolism & Body Composition",
    metric: "Body composition",
    label: "area of interest",
    description: "Explore research involving body composition, metabolic pathways, and insulin sensitivity.",
    compounds: ["MOTS-c", "AOD-9604"],
    image: "goal-fat-loss",
  },
  {
    title: "Cognition & Focus",
    metric: "Cognitive focus",
    label: "area of interest",
    description: "Explore research involving attention, memory, and neuroprotection.",
    compounds: ["Semax", "Selank", "Cerebrolysin"],
    image: "goal-cognition",
  },
  {
    title: "Longevity & Cellular Aging",
    metric: "Cellular aging",
    label: "area of interest",
    description: "Explore research involving cellular aging markers, mitochondrial function, and longevity pathways.",
    compounds: ["Epitalon", "NAD+", "Thymalin"],
    image: "goal-longevity",
  },
  {
    title: "Performance & Growth",
    metric: "Athletic performance",
    label: "area of interest",
    description: "Explore research involving growth hormone pathways and physical performance.",
    compounds: ["CJC-1295", "Ipamorelin", "MK-677"],
    image: "goal-performance",
  },
  {
    title: "Sleep & Hormonal Research",
    metric: "Sleep quality",
    label: "area of interest",
    description: "Explore research involving sleep architecture, hormonal signaling, mood, and related biological pathways.",
    compounds: ["DSIP", "PT-141", "Kisspeptin"],
    image: "goal-sleep",
  },
];

export default function Goals() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="goals" className="py-24 px-4 bg-background scroll-mt-24" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <SectionHead
          eyebrow="Areas of interest"
          title="Explore Research"
          accentTitle="by Topic"
          note="Browse published research by area of interest."
        />

        <div className="grid grid-cols-3 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1 gap-[18px]">
          {goals.map((goal, i) => (
            <motion.div
              key={goal.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              className="group flex flex-col relative rounded-[calc(var(--radius)+5px)] overflow-hidden bg-card border border-border transition-all duration-400 hover:-translate-y-[5px] hover:border-accent/40 hover:shadow-[0_26px_52px_-26px_rgba(200,150,80,0.5)]"
            >
              <div className="block relative overflow-hidden">
                <img
                  src={getSlotUrl(goal.image)}
                  width={400}
                  height={160}
                  loading="lazy"
                  decoding="async"
                  alt={`Illustration for the ${goal.title} category`}
                  className="block w-full h-auto transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(to top, oklch(1 0 0 / 90%) 2%, transparent 45%)" }}
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 flex flex-col px-5 pt-4 pb-5">
                <span className="block font-mono text-[10px] tracking-[.12em] uppercase text-accent mb-1.5">
                  {goal.metric}
                </span>
                <h3 className="text-lg font-semibold mb-[7px]">{goal.title}</h3>
                <p className="flex-1 text-[13.5px] text-muted-foreground leading-[1.55]">{goal.description}</p>
                <div className="flex flex-wrap gap-[5px] mt-3.5">
                  {goal.compounds.map((c) => (
                    <span
                      key={c}
                      className="font-mono text-[9.5px] tracking-[.06em] px-2 py-1 rounded-[6px] bg-accent/12 text-muted-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
