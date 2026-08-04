import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import SectionHead from "@/components/landing/SectionHead";
import { getSlotUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

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
        <SectionHead
          eyebrow="How it works"
          title="Four steps to"
          accentTitle="clarity"
          note="From your first question to research-backed guidance, we make peptide science accessible."
        />

        <div className="relative">
          {/* Center line, behind the steps — moves to the left edge once the
              layout stacks under 860px, where the dots move with it. */}
          <div
            className="absolute top-0 bottom-0 w-px bg-border left-1/2 max-[860px]:left-[19px]"
            aria-hidden="true"
          />

          {steps.map((step, i) => {
            const left = i % 2 === 0;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="grid grid-cols-[1fr_78px_1fr] max-[860px]:grid-cols-[40px_1fr] items-center mb-[26px]"
              >
                <span
                  className="relative z-[2] block rounded-full bg-accent justify-self-center max-[860px]:justify-self-start [grid-column:2] max-[860px]:[grid-column:1]"
                  style={{
                    width: 15,
                    height: 15,
                    boxShadow: "0 0 0 6px var(--background), 0 0 22px -2px oklch(from var(--accent) l c h / 80%)",
                  }}
                />
                <div
                  className={cn(
                    "grid grid-cols-[1fr_150px] max-[860px]:grid-cols-1 gap-5 items-center bg-card border border-border rounded-[calc(var(--radius)+4px)] p-6 transition-all duration-400 hover:border-accent/40 hover:shadow-[0_20px_44px_-26px_rgba(200,150,80,0.5)]",
                    "max-[860px]:[grid-column:2]",
                    left ? "[grid-column:1]" : "[grid-column:3]"
                  )}
                >
                  <div>
                    <span className="block font-mono text-[11px] tracking-[.14em] text-accent mb-[7px]">
                      {step.number}
                    </span>
                    <h3 className="text-[19px] font-semibold mb-[7px]">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {step.hiRes ? (
                    <img
                      src={getSlotUrl(step.image)}
                      srcSet={`${getSlotUrl(step.image)} 500w${getSlotUrl(step.image, "2x") ? `, ${getSlotUrl(step.image, "2x")} 1000w` : ""}`}
                      width={500}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      alt=""
                      className="block w-full h-auto rounded-[10px]"
                    />
                  ) : (
                    <img
                      src={getSlotUrl(step.image)}
                      width={500}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      alt=""
                      className="block w-full h-auto rounded-[10px]"
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
