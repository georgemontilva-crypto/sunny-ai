import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import SectionHead from "@/components/landing/SectionHead";
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
        <SectionHead
          eyebrow="How it works"
          title="Four steps to"
          accentTitle="clarity"
          note="From your first question to research-backed guidance, we make peptide science accessible."
        />

        <div className="relative">
          {/* The connecting line sits behind the steps; each dot's halo
              (boxShadow matching the section background) visually cuts a gap
              in it where the dot sits. */}
          <div
            className="absolute h-px bg-border max-[860px]:hidden"
            style={{ top: 38, left: "6%", right: "6%" }}
            aria-hidden="true"
          />

          <div className="grid grid-cols-4 gap-0 max-[860px]:grid-cols-2 max-[860px]:gap-x-8 max-[860px]:gap-y-12 max-[520px]:grid-cols-1 relative">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group px-4 first:pl-0 last:pr-0"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="block rounded-full bg-accent shrink-0"
                    style={{ width: 13, height: 13, boxShadow: "0 0 0 6px var(--background)" }}
                  />
                  <span className="font-mono text-sm text-muted-foreground">{step.number}</span>
                </div>
                <h3 className="text-[17.5px] font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground mb-5">{step.description}</p>
                <div className="rounded-xl overflow-hidden">
                  {step.hiRes ? (
                    <img
                      src={getSlotUrl(step.image)}
                      srcSet={`${getSlotUrl(step.image)} 500w${getSlotUrl(step.image, "2x") ? `, ${getSlotUrl(step.image, "2x")} 1000w` : ""}`}
                      width={500}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      alt={step.title}
                      className="block w-full h-auto rounded-xl grayscale-[.4] group-hover:grayscale-0 transition-[filter] duration-500"
                    />
                  ) : (
                    <img
                      src={getSlotUrl(step.image)}
                      width={500}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      alt={step.title}
                      className="block w-full h-auto rounded-xl grayscale-[.4] group-hover:grayscale-0 transition-[filter] duration-500"
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
