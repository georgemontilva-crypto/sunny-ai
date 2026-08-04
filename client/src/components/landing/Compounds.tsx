import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionHead from "@/components/landing/SectionHead";
import { useAnimateWhileVisible } from "@/hooks/useAnimateWhileVisible";
import { compoundLibrary } from "@/lib/compoundLibrary";
import { getSlotUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

function EvidenceBar({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <span className="grid grid-cols-[66px_1fr] items-center gap-[9px] font-mono text-[9px] tracking-[.08em] uppercase text-background/48">
      {label}
      <span className="block h-[3px] rounded-full bg-background/12 overflow-hidden">
        <span
          className="block h-full rounded-full"
          style={{
            width: active ? `${value}%` : "0%",
            background: "linear-gradient(90deg, oklch(from var(--accent) l c h / 50%), var(--accent))",
            transition: "width 1.1s var(--e)",
          }}
        />
      </span>
    </span>
  );
}

export default function Compounds() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const bgAnimating = useAnimateWhileVisible(sectionRef);
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 2;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= max);
  };

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, []);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    const card = el?.querySelector<HTMLElement>("[data-card]");
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 20), behavior: "smooth" });
  };

  return (
    <section id="compounds" className="py-24 px-4 bg-noche relative overflow-hidden" ref={sectionRef}>
      <div
        className={cn("hero-light", !bgAnimating && "anim-paused")}
        style={{
          width: 900,
          height: 900,
          top: -340,
          left: -220,
          background: "radial-gradient(circle, oklch(from var(--accent) l c h / 15%), transparent 66%)",
          animation: "hero-drift-2 28s ease-in-out infinite",
        }}
        aria-hidden="true"
      />
      <div className="hero-grain" aria-hidden="true" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <SectionHead dark eyebrow="Research summaries" title="Compound" accentTitle="Library" note="Not medical advice." />

        <p className="text-sm text-background/60 max-w-2xl -mt-6 mb-10">
          Research summaries in conditional language. The information provided here is strictly educational.
          Sunny does not provide dosing instructions, protocols, medical claims, or recommendations for human
          use.
        </p>

        <div className="relative">
          <div
            className={cn(
              "pointer-events-none absolute top-0 bottom-[30px] left-0 w-[70px] z-10 transition-opacity duration-300",
              atStart ? "opacity-0" : "opacity-100"
            )}
            style={{ background: "linear-gradient(90deg, var(--noche), transparent)" }}
            aria-hidden="true"
          />
          <div
            className={cn(
              "pointer-events-none absolute top-0 bottom-[30px] right-0 w-[70px] z-10 transition-opacity duration-300",
              atEnd ? "opacity-0" : "opacity-100"
            )}
            style={{ background: "linear-gradient(270deg, var(--noche), transparent)" }}
            aria-hidden="true"
          />

          <div
            ref={trackRef}
            onScroll={updateEdges}
            className="flex gap-5 overflow-x-auto pt-5 -mt-5 pb-[30px] -mb-[30px] px-[30px] -mx-[30px] scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: "touch", scrollPaddingInline: "30px" }}
          >
            {compoundLibrary.map((c, i) => (
              <motion.article
                key={c.name}
                data-card
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="shrink-0 basis-[354px] max-[520px]:basis-[84%] snap-start rounded-[calc(var(--radius)+5px)] overflow-hidden border border-background/13 bg-background/[.045] backdrop-blur-[14px] max-[768px]:backdrop-blur-none max-[768px]:bg-background/9 max-[768px]:border-background/18 transition-all duration-400 hover:border-accent/40 hover:shadow-[0_26px_54px_-28px_rgba(0,0,0,0.8)]"
              >
                <div className="relative leading-[0]">
                  <img
                    src={getSlotUrl(c.image)}
                    width={350}
                    height={140}
                    loading="lazy"
                    decoding="async"
                    alt={`${c.name} research-grade vial`}
                    className="block w-full h-auto"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to top, oklch(from var(--noche) l c h / 50%) 1%, transparent 32%)" }}
                  />
                </div>
                <div className="px-5 pt-[18px] pb-5">
                  <span className="block font-mono text-[10px] tracking-[.12em] uppercase text-accent mb-1.5">
                    {c.category}
                  </span>
                  <h3 className="text-xl font-semibold text-background mb-2">{c.name}</h3>
                  <p className="text-[13.5px] text-background/60 leading-[1.55]">{c.description}</p>

                  {c.evidenceBars && (
                    <div className="flex flex-col gap-[7px] mt-4 pt-[15px] border-t border-background/10">
                      <EvidenceBar label="Preclinical" value={c.evidenceBars.preclinical} active={isInView} />
                      <EvidenceBar label="Animal" value={c.evidenceBars.animal} active={isInView} />
                      <EvidenceBar label="Human" value={c.evidenceBars.human} active={isInView} />
                    </div>
                  )}

                  {c.evidenceTags && c.evidenceTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {c.evidenceTags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[9px] tracking-[.08em] uppercase border border-background/20 rounded-full px-[9px] py-1 text-background/55"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <div className="flex gap-[9px] mt-[18px] justify-end">
          <button
            type="button"
            aria-label="Previous"
            disabled={atStart}
            onClick={() => scrollByCard(-1)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-background/80 bg-background/6 backdrop-blur-[14px] border border-background/16 transition-all duration-300 hover:bg-accent/18 hover:border-accent/50 hover:text-accent disabled:opacity-25 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-[17px] h-[17px]" />
          </button>
          <button
            type="button"
            aria-label="Next"
            disabled={atEnd}
            onClick={() => scrollByCard(1)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-background/80 bg-background/6 backdrop-blur-[14px] border border-background/16 transition-all duration-300 hover:bg-accent/18 hover:border-accent/50 hover:text-accent disabled:opacity-25 disabled:pointer-events-none"
          >
            <ChevronRight className="w-[17px] h-[17px]" />
          </button>
        </div>
      </div>
    </section>
  );
}
