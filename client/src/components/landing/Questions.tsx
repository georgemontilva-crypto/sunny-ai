import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { getSlotUrl } from "@/lib/media";
import { ArrowRight } from "lucide-react";

const questions = [
  {
    metric: "Sleep quality",
    label: "area of interest",
    question: "What does the literature say about peptides studied for sleep quality?",
    category: "Sleep",
    image: "sleep-quality",
    hiRes: false,
  },
  {
    metric: "Body composition",
    label: "area of interest",
    question: "Which compounds appear in body composition research, and in what models?",
    category: "Fat Loss",
    image: "body-composition",
    hiRes: false,
  },
  {
    metric: "Tissue repair",
    label: "area of interest",
    question: "How is tissue repair studied, and where does the evidence stop?",
    category: "Recovery",
    image: "tissue-repair",
    hiRes: false,
  },
  {
    metric: "Cognitive focus",
    label: "area of interest",
    question: "What has been published on peptides and cognitive focus?",
    category: "Focus",
    image: "cognitive-focus",
    hiRes: true,
  },
  {
    metric: "Hormonal balance",
    label: "area of interest",
    question: "How does the research approach hormonal pathways?",
    category: "Libido",
    image: "hormonal-balance",
    hiRes: true,
  },
  {
    metric: "Skin & hair health",
    label: "area of interest",
    question: "What is documented about peptides in skin and hair research?",
    category: "Skin & Hair",
    image: "skin-hair",
    hiRes: true,
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
                {q.hiRes ? (
                  <img
                    src={getSlotUrl(`card-${q.image}`)}
                    srcSet={`${getSlotUrl(`card-${q.image}`)} 800w${getSlotUrl(`card-${q.image}`, "2x") ? `, ${getSlotUrl(`card-${q.image}`, "2x")} 1600w` : ""}`}
                    sizes="(max-width: 768px) 100vw, 400px"
                    width={800}
                    height={320}
                    loading="lazy"
                    decoding="async"
                    alt={`Research-grade vial, ${q.image} category`}
                    className="w-full h-40 object-cover object-center rounded-xl mb-4"
                  />
                ) : (
                  <img
                    src={getSlotUrl(`card-${q.image}`)}
                    width={400}
                    height={160}
                    loading="lazy"
                    decoding="async"
                    alt={`Research-grade vial, ${q.image} category`}
                    className="w-full h-40 object-cover object-center rounded-xl mb-4"
                  />
                )}
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
