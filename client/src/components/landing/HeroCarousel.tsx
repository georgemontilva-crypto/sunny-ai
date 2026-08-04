import { useEffect, useState } from "react";
import { getSlotUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

const SLOTS = ["hero-sunny", "hero-sunny-2", "hero-sunny-3"];
const ROTATE_MS = 4200;

interface CarouselImage {
  slot: string;
  base: string;
  base2x?: string;
  mobile?: string;
}

// Smallest-first so a browser that only reads the first matching candidate
// (some older ones) still gets the mobile-sized file rather than the 1400px
// base — the 700w mobile variant is what keeps small phones from
// downloading the desktop asset.
function buildSrcSet(img: CarouselImage): string | undefined {
  const parts: string[] = [];
  if (img.mobile) parts.push(`${img.mobile} 700w`);
  parts.push(`${img.base} 1400w`);
  if (img.base2x) parts.push(`${img.base2x} 2800w`);
  return parts.length > 1 ? parts.join(", ") : undefined;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Reads all three hero image slots and only shows whatever actually has an
// image — 1, 2, or 3. Never a gap, never a broken <img>: a slot with nothing
// uploaded just isn't in `images` at all (see client/src/lib/media.ts).
export default function HeroCarousel({ bgAnimating = true }: { bgAnimating?: boolean }) {
  const images: CarouselImage[] = SLOTS.map((slot): CarouselImage | null => {
    const base = getSlotUrl(slot);
    return base ? { slot, base, base2x: getSlotUrl(slot, "2x"), mobile: getSlotUrl(slot, "mobile") } : null;
  }).filter((img): img is CarouselImage => img !== null);

  const count = images.length;
  const reducedMotion = usePrefersReducedMotion();
  const [front, setFront] = useState(0);

  // Rotates on its own, always — never pauses on hover. Off entirely under
  // reduced motion (renders just the first image, no rotation) or with a
  // single image (nothing to rotate to).
  useEffect(() => {
    if (reducedMotion || count <= 1) return;
    const id = setInterval(() => {
      setFront((f) => (f + 1) % count);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [count, reducedMotion]);

  if (count === 0) return null;

  const visible = reducedMotion ? images.slice(0, 1) : images;
  const visibleCount = visible.length;

  return (
    <div className={cn("hero-portrait-wrap", !bgAnimating && "anim-paused")}>
      {visible.map((img, i) => {
        const pos = visibleCount > 1 ? (i - front + visibleCount) % visibleCount : 0;
        return (
          <div key={img.slot} className={`hero-carousel-card hero-carousel-card--p${pos}`}>
            <img
              src={img.base}
              srcSet={buildSrcSet(img)}
              sizes="(max-width: 940px) 100vw, 57vw"
              width={1400}
              height={700}
              fetchPriority={i === 0 ? "high" : undefined}
              loading={i === 0 ? undefined : "lazy"}
              decoding="async"
              alt={i === 0 ? "Sunny, the AI peptide research assistant" : ""}
            />
            <span className="hero-carousel-chip absolute left-4 bottom-4 flex items-center gap-2 px-3 py-2 rounded-full bg-background/10 backdrop-blur-md border border-background/15 text-xs font-medium text-background">
              <span className="pulse-dot" />
              Research assistant
            </span>
          </div>
        );
      })}

      {!reducedMotion && visibleCount > 1 && (
        <div className="hero-carousel-dots">
          {visible.map((img, i) => (
            <button
              key={img.slot}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => setFront(i)}
              className={`hero-carousel-dot ${i === front ? "hero-carousel-dot--active" : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
