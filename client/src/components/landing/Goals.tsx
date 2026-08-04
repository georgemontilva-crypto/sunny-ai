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

        {/* Every tile is the same size (no column spans) — aspect-ratio
            2.5/1 exactly matches the images' native 400x160, so
            object-fit: cover here never crops or upscales anything, unlike
            the rest of this redesign's images. */}
        <div className="grid grid-cols-3 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1 gap-4">
          {goals.map((goal, i) => (
            <motion.div
              key={goal.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              className="group relative rounded-2xl overflow-hidden"
              style={{ aspectRatio: "2.5 / 1" }}
            >
              <img
                src={getSlotUrl(goal.image)}
                width={400}
                height={160}
                loading="lazy"
                decoding="async"
                alt={`Illustration for the ${goal.title} category`}
                className="goals-card-image absolute inset-0 w-full h-full object-cover -z-20 transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 -z-10"
                style={{
                  background:
                    "linear-gradient(to top, oklch(from var(--noche) l c h / 90%) 0%, oklch(from var(--noche) l c h / 18%) 100%)",
                }}
                aria-hidden="true"
              />

              <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5">
                {goal.compounds.map((c) => (
                  <span
                    key={c}
                    className="font-mono text-[10px] px-2 py-1 rounded-full bg-background/14 backdrop-blur-md text-white"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <h3 className="absolute bottom-3 left-4 right-4 text-[17px] font-semibold text-white">
                {goal.title}
              </h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
