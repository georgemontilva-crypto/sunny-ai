import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const questions = [
  {
    metric: "+47 min",
    label: "deep sleep / night",
    question: "I keep waking up at 3am exhausted — what peptide could help me sleep?",
    category: "Sleep",
  },
  {
    metric: "−14 lbs",
    label: "avg. in 12 weeks",
    question: "I've tried everything for stubborn belly fat. What's safer than shots?",
    category: "Fat Loss",
  },
  {
    metric: "2.3×",
    label: "faster tissue repair",
    question: "My shoulder hasn't healed in 6 months. What speeds up tissue repair?",
    category: "Recovery",
  },
  {
    metric: "+38%",
    label: "sustained focus",
    question: "Brain fog is ruining my work. Which peptides sharpen focus?",
    category: "Focus",
  },
  {
    metric: "Day 7",
    label: "first noticeable shift",
    question: "My drive is gone and I'm 38. What's safe to try before TRT?",
    category: "Libido",
  },
  {
    metric: "8 wks",
    label: "visible regrowth",
    question: "Can peptides really help with hair thinning and skin tone?",
    category: "Skin & Hair",
  },
];

export default function Questions() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-4 bg-secondary/30" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Real questions people ask
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Science-first answers tailored to your goals. Judgment-free, research-backed guidance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questions.map((q, i) => (
            <motion.div
              key={q.category}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
            >
              <Card className="p-6 h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer group overflow-hidden">
                {/* QUESTION CARD IMAGE PLACEHOLDER - 400x160px */}
                <div className="bg-gray-300 w-full h-40 rounded-lg mb-4 flex items-center justify-center text-gray-600 text-xs font-medium -mx-6 -mt-6 mb-4">
                  <div className="text-center">
                    <div className="font-bold">400 × 160px</div>
                    <div className="text-xs mt-1">{q.category}</div>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-accent">{q.metric}</span>
                  <span className="text-xs text-muted-foreground">{q.label}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">"{q.question}"</p>
                <div className="flex items-center gap-2 text-xs font-medium text-accent group-hover:gap-3 transition-all">
                  Ask Sunny <ArrowRight className="w-3 h-3" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
