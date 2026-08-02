import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { getSlotUrl } from "@/lib/media";
import { ArrowRight } from "lucide-react";

const goals = [
  {
    title: "Recovery & Healing",
    metric: "Tissue repair",
    label: "area of interest",
    description: "Tissue repair, injury support, faster bounce-back from training and surgery.",
    compounds: ["BPC-157", "TB-500", "GHK-Cu"],
    image: "goal-recovery",
  },
  {
    title: "Fat Loss & Metabolic",
    metric: "Body composition",
    label: "area of interest",
    description: "Body recomposition, metabolic optimization, insulin sensitivity.",
    compounds: ["MOTS-c", "AOD-9604"],
    image: "goal-fat-loss",
  },
  {
    title: "Cognition & Focus",
    metric: "Cognitive focus",
    label: "area of interest",
    description: "Compounds studied in the nootropic literature.",
    compounds: ["Semax", "Selank", "Cerebrolysin"],
    image: "goal-cognition",
  },
  {
    title: "Longevity & Anti-Aging",
    metric: "Cellular aging",
    label: "area of interest",
    description: "Cellular health, mitochondrial repair, research on cellular aging markers.",
    compounds: ["Epitalon", "NAD+", "Thymalin"],
    image: "goal-longevity",
  },
  {
    title: "Performance & Growth",
    metric: "Athletic performance",
    label: "area of interest",
    description: "Compounds studied in growth hormone and performance research.",
    compounds: ["CJC-1295", "Ipamorelin", "MK-677"],
    image: "goal-performance",
  },
  {
    title: "Sleep & Hormones",
    metric: "Sleep quality",
    label: "area of interest",
    description: "Deep sleep architecture, cortisol balance, libido, mood — the foundation.",
    compounds: ["DSIP", "PT-141", "Kisspeptin"],
    image: "goal-sleep",
  },
];

export default function Goals() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="goals" className="py-24 px-4 bg-background" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Personalized to your goal
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pick what's on your mind. We meet you exactly where you are.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal, i) => (
            <motion.div
              key={goal.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
            >
              <Card className="p-6 h-full flex flex-col hover:shadow-md transition-shadow group cursor-pointer overflow-hidden">
                <motion.div
                  className="w-full h-40 rounded-lg mb-4 overflow-hidden mx-auto"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={getSlotUrl(goal.image)}
                    width={400}
                    height={160}
                    loading="lazy"
                    decoding="async"
                    alt={`Illustration for the ${goal.title} category`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </motion.div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-accent">{goal.metric}</span>
                  <span className="text-xs text-muted-foreground">{goal.label}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{goal.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">{goal.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {goal.compounds.map((c) => (
                    <span key={c} className="text-xs px-2 py-1 bg-accent/10 text-accent rounded">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-accent group-hover:gap-3 transition-all">
                  Learn more <ArrowRight className="w-3 h-3" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
