import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  accentTitle: string;
  note?: string;
  /** Dark (noche) section variant — swaps border/text colors for contrast. */
  dark?: boolean;
  className?: string;
}

// Reusable section header used across the home page: eyebrow + display
// headline (with a trailing accent-colored fragment) on the left, a short
// line of context right-aligned and bottom-aligned on the right, a border
// between the header and the section body. Collapses to one column with a
// left-aligned note under 820px.
export default function SectionHead({ eyebrow, title, accentTitle, note, dark, className }: SectionHeadProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={cn(
        "grid grid-cols-[1fr_auto] max-[820px]:grid-cols-1 items-end gap-8 pb-[22px] border-b mb-[46px]",
        dark ? "border-background/16" : "border-border",
        className
      )}
    >
      <div>
        <p
          className={cn(
            "font-mono text-[11px] tracking-[.14em] uppercase mb-[13px]",
            dark ? "text-accent" : "text-muted-foreground"
          )}
        >
          {eyebrow}
        </p>
        <h2
          className={cn(
            "text-[clamp(32px,4.2vw,52px)] font-semibold leading-[1.03] max-w-[16ch]",
            dark && "text-background"
          )}
        >
          {title} <span className="text-accent">{accentTitle}</span>
        </h2>
      </div>
      {note && (
        <p
          className={cn(
            "text-[15px] max-w-[34ch] pb-1.5 text-right max-[820px]:text-left max-[820px]:max-w-none",
            dark ? "text-background/55" : "text-muted-foreground"
          )}
        >
          {note}
        </p>
      )}
    </motion.div>
  );
}
