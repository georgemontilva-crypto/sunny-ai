import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    title: "Tell us your goals",
    description: "Share what you're optimizing for — recovery, performance, longevity, or metabolic health.",
    imageName: "goals",
  },
  {
    number: "02",
    title: "Smart research analysis",
    description: "We review published literature and map the most relevant peptide research to your goals.",
    imageName: "intake",
  },
  {
    number: "03",
    title: "Get clear guidance",
    description: "Receive research-backed recommendations with citations and educational context.",
    imageName: "pathway",
  },
  {
    number: "04",
    title: "Explore at your pace",
    description: "Browse our compound library and dive deeper into the science whenever you're ready.",
    imageName: "optimize",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="py-24 px-4 bg-background" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
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
                {/* HOW IT WORKS IMAGE PLACEHOLDER - 500x300px */}
                <div className="bg-gray-300 w-full h-48 rounded-lg mb-6 flex items-center justify-center text-gray-600 text-xs font-medium -mx-8 -mt-8 mb-6">
                  <div className="text-center">
                    <div className="font-bold">500 × 300px</div>
                    <div className="text-xs mt-1">{step.imageName}</div>
                  </div>
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
