import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import HeroCarousel from "@/components/landing/HeroCarousel";
import { useAnimateWhileVisible } from "@/hooks/useAnimateWhileVisible";
import { cn } from "@/lib/utils";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgAnimating = useAnimateWhileVisible(sectionRef);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="pt-40 pb-16 md:pb-32 px-4 min-h-screen flex items-center justify-center relative overflow-hidden scroll-mt-24 bg-noche"
      id="hero"
    >
      {/* Background: three drifting radial gold light layers + a grain layer
          to keep the gradients from banding — replaces the old hero-bg photo
          entirely (the media slot itself is untouched, just unused here).
          Paused (not unmounted) while the section is scrolled out of view —
          see useAnimateWhileVisible. */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className={cn("hero-light hero-light-1", !bgAnimating && "anim-paused")} />
        <div className={cn("hero-light hero-light-2", !bgAnimating && "anim-paused")} />
        <div className={cn("hero-light hero-light-3", !bgAnimating && "anim-paused")} />
        <div className="hero-grain" />
      </div>

      {/* Content.

          Every entrance animation in this section is CSS (the .reveal-*
          classes in index.css), not framer-motion, and that is a
          performance decision rather than a stylistic one: framer-motion
          writes its `initial` prop into the server-rendered markup as
          style="opacity:0", so the whole hero used to ship invisible and
          stay that way until the client bundle had downloaded and hydrated.
          Lighthouse measured that wait as ~656ms of LCP "element render
          delay" locally and ~1189ms on the deployed site. CSS animations
          start on the browser's first frame instead, with no JS involved.

          Sections below the fold still use framer-motion — they animate on
          scroll, by which time the bundle is long since parsed, and they
          are not LCP candidates. */}
      <div className="container mx-auto max-w-7xl relative z-10">
        <div
          className="grid grid-cols-1 min-[940px]:grid-cols-[.86fr_1.14fr] items-center"
          style={{ gap: "clamp(26px, 4vw, 48px)" }}
        >
          {/* LEFT SIDE - TEXT CONTENT */}
          <div className="text-left reveal-left">
            <div className="reveal-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-background/16 bg-background/9 backdrop-blur-md max-[768px]:backdrop-blur-none max-[768px]:bg-background/[0.16] max-[768px]:border-background/25 text-xs font-medium text-accent mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered peptide research
            </div>

            {/* No reveal delay: this is the LCP element on a narrow viewport
                (measured), and an element at opacity 0 is not an LCP
                candidate — every millisecond of delay here is a millisecond
                added to LCP. */}
            <h1 className="reveal-up text-[clamp(42px,6.4vw,78px)] font-semibold mb-6 max-w-[13ch] text-background">
              Peptide Research,{" "}
              <span className="bg-gradient-to-r from-accent via-accent/80 to-accent/60 bg-clip-text text-transparent">
                Made Clear
              </span>
            </h1>

            <p className="reveal-up reveal-d2 text-[clamp(16px,1.7vw,19px)] text-background/68 mb-10 max-w-[42ch]">
              Sunny organizes peptide research and explains the science in clear, accessible language.
            </p>

            <div className="reveal-up reveal-d3 flex flex-col sm:flex-row items-start gap-3">
              <Button size="lg" className="hero-cta-glow text-base font-semibold px-8 h-12 rounded-full" asChild>
                <Link href="/chat">
                  Start Exploring
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-base font-medium px-8 h-12 rounded-full border border-background/18 bg-background/7 backdrop-blur-md max-[768px]:backdrop-blur-none max-[768px]:bg-background/[0.14] max-[768px]:border-background/28 text-background hover:bg-background/14 hover:text-background"
                onClick={() => scrollToSection("compounds")}
              >
                Browse Compounds
              </Button>
            </div>

            <p className="reveal-up reveal-d5 text-[12.5px] text-background/40 mt-8">
              Educational research content. Not medical advice. For adults 21+.
            </p>
          </div>

          {/* RIGHT SIDE - HERO CAROUSEL. Also undelayed: it is the LCP
              element on the deployed site, where the image outweighs the
              headline. */}
          <div className="relative reveal-right">
            <HeroCarousel bgAnimating={bgAnimating} />
          </div>
        </div>
      </div>
    </section>
  );
}
