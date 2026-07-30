import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Does Sunny sell or distribute peptides?",
    a: "No. Sunny doesn't sell, manufacture, or distribute any compound. We publish educational summaries of available scientific literature, nothing more.",
  },
  {
    q: "Is this medical advice?",
    a: "No. Nothing we publish diagnoses, treats, or prescribes. It's educational and research content — any decision about your health should go through a qualified professional.",
  },
  {
    q: "Why don't you include dosing or protocols?",
    a: "Because it isn't information that's ours to give. Dosing is a clinical decision that depends on each individual, and only a qualified health professional can assess it.",
  },
  {
    q: "How do you decide which compounds to include in the library?",
    a: "We prioritize compounds with published, verifiable literature — preclinical or clinical — and we say so explicitly on each entry. If the evidence is weak or nonexistent, we say that too.",
  },
  {
    q: "Do you offer integrations for clinics or brands?",
    a: "Yes, through embed or white-label. Check the section for clinics and brands above, or reach out through the contact form.",
  },
];

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-4 bg-background" ref={ref}>
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Straight answers about what Sunny is — and isn't.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
