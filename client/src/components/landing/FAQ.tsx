import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionHead from "@/components/landing/SectionHead";
import { FAQS, type FaqEntry } from "@/lib/faq";


// A link inside an answer stays a link on the page, while lib/faq.ts's
// faqAnswerText() flattens the same segments to the plain text the FAQPage
// JSON-LD indexes.
function FaqAnswer({ entry }: { entry: FaqEntry }) {
  return (
    <>
      {entry.a.map((segment, i) =>
        typeof segment === "string" ? (
          segment
        ) : (
          <Link key={i} href={segment.href} className="text-accent hover:underline">
            {segment.text}
          </Link>
        )
      )}
    </>
  );
}

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-4 bg-background" ref={ref}>
      <div className="container mx-auto max-w-3xl">
        <SectionHead
          eyebrow="FAQ"
          title="Frequently asked"
          accentTitle="questions"
          note="Straight answers about what Sunny is — and isn't."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-2.5">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border rounded-[var(--radius)] bg-card px-[22px] transition-colors duration-300 data-[state=open]:border-accent/40"
              >
                <AccordionTrigger className="text-left font-medium text-base py-[18px] hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-[15px] max-w-[64ch] pb-5">
                  <FaqAnswer entry={faq} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
