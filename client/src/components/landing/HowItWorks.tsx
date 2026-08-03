import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { getSlotUrl } from "@/lib/media";

const steps = [
  {
    number: "01",
    title: "Ask a Research Question",
    description: "Share the compound, topic, or area of research you would like to understand.",
    image: "how-goals",
    hiRes: false,
  },
  {
    number: "02",
    title: "Sunny Reviews the Literature",
    description: "Sunny identifies and organizes published research related to your question.",
    image: "how-analysis",
    hiRes: false,
  },
  {
    number: "03",
    title: "Receive a Clear Summary",
    description: "Review the findings, citations, research limitations, and important areas of uncertainty.",
    image: "how-guidance",
    hiRes: false,
  },
  {
    number: "04",
    title: "Continue Exploring",
    description: "Ask follow-up questions or browse the compound library at your own pace.",
    image: "how-explore",
    hiRes: true,
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="py-24 px-4 bg-background scroll-mt-24" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Four steps to clarity
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From your first question to research-backed guidance, we make peptide science accessible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card className="p-8 h-full">
                <div className="w-full h-48 rounded-lg mb-6 overflow-hidden">
                  {step.hiRes ? (
                    <img
                      src={getSlotUrl(step.image)}
                      srcSet={`${getSlotUrl(step.image)} 500w${getSlotUrl(step.image, "2x") ? `, ${getSlotUrl(step.image, "2x")} 1000w` : ""}`}
                      width={500}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      alt={step.title}
                      className="w-full h-full object-cover object-top rounded-xl"
                    />
                  ) : (
                    <img
                      src={getSlotUrl(step.image)}
                      width={500}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      alt={step.title}
                      className="w-full h-full object-cover object-top rounded-xl"
                    />
                  )}
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-4xl font-bold text-accent/30">{step.number}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
