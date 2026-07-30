import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const goals = [
  {
    title: "Recovery & Healing",
    metric: "2.3×",
    label: "faster repair",
    description: "Tissue repair, injury support, faster bounce-back from training and surgery.",
    compounds: ["BPC-157", "TB-500", "GHK-Cu"],
  },
  {
    title: "Fat Loss & Metabolic",
    metric: "−14 lbs",
    label: "in 12 wks (avg)",
    description: "Body recomposition, metabolic optimization, insulin sensitivity.",
    compounds: ["MOTS-c", "AOD-9604"],
  },
  {
    title: "Cognition & Focus",
    metric: "+38%",
    label: "sustained focus",
    description: "Sharpen focus, memory, and mental clarity with nootropic peptide research.",
    compounds: ["Semax", "Selank", "Cerebrolysin"],
  },
  {
    title: "Longevity & Anti-Aging",
    metric: "−6.2 yrs",
    label: "biological age",
    description: "Cellular health, mitochondrial repair, biological age reversal protocols.",
    compounds: ["Epitalon", "NAD+", "Thymalin"],
  },
  {
    title: "Performance & Growth",
    metric: "+22%",
    label: "lean mass / cycle",
    description: "Growth hormone support, athletic output, lean mass and recovery.",
    compounds: ["CJC-1295", "Ipamorelin", "MK-677"],
  },
  {
    title: "Sleep & Hormones",
    metric: "+47 min",
    label: "deep sleep / night",
    description: "Deep sleep architecture, cortisol balance, libido, mood — the foundation.",
    compounds: ["DSIP", "PT-141", "Kisspeptin"],
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
                {/* GOAL CARD IMAGE PLACEHOLDER - 400x160px */}
                <motion.div 
                  className="bg-gradient-to-br from-gray-300 to-gray-400 w-full h-40 rounded-lg mb-4 flex items-center justify-center text-gray-600 text-xs font-medium mx-auto"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center">
                    <div className="font-bold">400 × 160px</div>
                    <div className="text-xs mt-1">{goal.title}</div>
                  </div>
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
