import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight, Moon, Flame, Zap, Brain, Heart, Sparkles } from "lucide-react";

const questions = [
  {
    metric: "Sleep quality",
    label: "area of interest",
    question: "I keep waking up at 3am exhausted — what peptide could help me sleep?",
    category: "Sleep",
    icon: Moon,
  },
  {
    metric: "Body composition",
    label: "area of interest",
    question: "I've tried everything for stubborn belly fat. What's safer than shots?",
    category: "Fat Loss",
    icon: Flame,
  },
  {
    metric: "Tissue repair",
    label: "area of interest",
    question: "My shoulder hasn't healed in 6 months. What speeds up tissue repair?",
    category: "Recovery",
    icon: Zap,
  },
  {
    metric: "Cognitive focus",
    label: "area of interest",
    question: "Brain fog is ruining my work. Which peptides sharpen focus?",
    category: "Focus",
    icon: Brain,
  },
  {
    metric: "Hormonal balance",
    label: "area of interest",
    question: "My drive is gone and I'm 38. What's safe to try before TRT?",
    category: "Libido",
    icon: Heart,
  },
  {
    metric: "Skin & hair health",
    label: "area of interest",
    question: "Can peptides really help with hair thinning and skin tone?",
    category: "Skin & Hair",
    icon: Sparkles,
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
                {/* QUESTION CARD IMAGE PLACEHOLDER - 400x160px with icon */}
                <motion.div 
                  className="bg-gradient-to-br from-gray-300 to-gray-400 w-full h-40 rounded-lg mb-4 flex items-center justify-center text-gray-600 text-xs font-medium mx-auto"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="text-center"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <q.icon className="w-12 h-12 mx-auto mb-2 opacity-60" />
                    <div className="font-bold text-sm">400 × 160px</div>
                    <div className="text-xs mt-1">{q.category}</div>
                  </motion.div>
                </motion.div>
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
