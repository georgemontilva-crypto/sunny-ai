import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { categoryCounts, compoundLibrary, evidenceLevelCounts } from "@/lib/compoundLibrary";
import { getAllPosts } from "@/lib/blog";

const EASE = [0.23, 1, 0.32, 1] as const;

// Counts up 0 → value once it enters view; jumps straight to the final
// value under prefers-reduced-motion, per the site's existing motion rules.
function AnimatedCounter({ value, reduce }: { value: number; reduce: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: EASE,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return <span>{display}</span>;
}

function EvidenceBar({
  label,
  count,
  max,
  delay,
  reduce,
}: {
  label: string;
  count: number;
  max: number;
  delay: number;
  reduce: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const pct = max > 0 ? (count / max) * 100 : 0;
  const grown = reduce || inView;

  return (
    <div ref={ref} className="flex items-center gap-4">
      <span className="w-36 shrink-0 text-sm text-muted-foreground truncate">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-secondary/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={reduce ? false : { width: "0%" }}
          animate={{ width: grown ? `${pct}%` : "0%" }}
          transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : delay, ease: EASE }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-sm font-medium tabular-nums">{count}</span>
    </div>
  );
}

export default function CatalogInsights() {
  const reduce = !!useReducedMotion();
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-80px" });

  const bars = evidenceLevelCounts();
  const maxCount = Math.max(...bars.map((b) => b.count), 1);
  const categoryCount = categoryCounts().length;
  const postCount = getAllPosts().length;

  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          ref={headingRef}
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={reduce || headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            What Sunny knows about your catalog
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every figure below comes straight from the compound library — nothing here is a projection.
          </p>
        </motion.div>

        <Card className="p-8">
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            Compounds indexed, by evidence level
          </h3>
          <div className="space-y-5">
            {bars.map((b, i) => (
              <EvidenceBar
                key={b.level}
                label={b.label}
                count={b.count}
                max={maxCount}
                delay={i * 0.1}
                reduce={reduce}
              />
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10 text-center">
          <div>
            <div className="text-4xl font-bold text-accent tabular-nums">
              <AnimatedCounter value={compoundLibrary.length} reduce={reduce} />
            </div>
            <div className="text-sm text-muted-foreground mt-1">Compounds indexed</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent tabular-nums">
              <AnimatedCounter value={categoryCount} reduce={reduce} />
            </div>
            <div className="text-sm text-muted-foreground mt-1">Research categories</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent tabular-nums">
              <AnimatedCounter value={postCount} reduce={reduce} />
            </div>
            <div className="text-sm text-muted-foreground mt-1">Blog posts published</div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {compoundLibrary.map((c) => (
            <span
              key={c.name}
              className="font-mono text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground"
            >
              {c.name} <span className="text-accent">· {c.evidenceLevel}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
