import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ParticleBackground from "@/components/landing/ParticleBackground";
import { getSlotDef } from "@server/mediaCatalog.ts";
import { getSlotUrl } from "@/lib/media";
import {
  ArrowRight, Sparkles, Boxes, Quote, Palette, ShieldCheck,
  BookOpenCheck, Ban, Stethoscope, ScrollText, UserCheck, Check,
} from "lucide-react";

const EASE = [0.23, 1, 0.32, 1] as const;

const capabilities = [
  {
    icon: Boxes,
    title: "Trained on your catalog",
    body: "Sunny only discusses compounds you actually carry. No competitors, no products you don't stock.",
  },
  {
    icon: Quote,
    title: "Cites what it draws on",
    body: "Every summary points back to the published work behind it, so customers can check it and your team can defend it.",
  },
  {
    icon: Palette,
    title: "Speaks in your voice",
    body: "Your name, your tone, your domain. Customers experience it as part of your brand, not a bolted-on widget.",
  },
];

const guardrails = [
  { icon: Ban, title: "No dosing", body: "Never states amounts, schedules, or cycle lengths, however the question is framed." },
  { icon: ScrollText, title: "No protocols", body: "Won't design a stack or a plan. Describes what has been studied, not what to do." },
  { icon: Stethoscope, title: "No diagnosis", body: "Symptoms are redirected to a licensed clinician, every time, without exception." },
  { icon: BookOpenCheck, title: "Conditional language", body: '"Studied in animal models" — never "will improve." The evidence line is always visible.' },
  { icon: UserCheck, title: "Age gate and disclosure", body: "21+ confirmation, research-use framing, and your commercial relationship disclosed up front." },
];

const launchSteps = [
  { n: "01", title: "Onboarding call", body: "Thirty minutes. We learn your catalog, your voice, and where your team wants the hard stops." },
  { n: "02", title: "Training and review", body: "We train on your products and edge cases. You read the transcripts and the refusal set before anything ships." },
  { n: "03", title: "One-line install", body: "A single script tag on your site. No engineering time on your side." },
  { n: "04", title: "Tuning", body: "We watch the conversations weekly and tighten the prompts as real questions come in." },
];

const compounds = ["BPC-157", "TB-500", "GHK-Cu", "MOTS-c", "Semax", "Tesamorelin", "Sermorelin"];

/** Reveal on scroll, matching the site's existing motion language. */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={inView || reduce ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** The visitor question types itself out, then the routed product card appears. */
function RoutingDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduce = useReducedMotion();
  const phrase = "What's actually been studied on tissue repair?";
  const [typed, setTyped] = useState("");
  const [routed, setRouted] = useState(false);

  useEffect(() => {
    if (reduce) { setTyped(phrase); setRouted(true); return; }
    if (!inView) return;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTyped(phrase.slice(0, i));
      if (i >= phrase.length) { clearInterval(t); setTimeout(() => setRouted(true), 320); }
    }, 34);
    return () => clearInterval(t);
  }, [inView, reduce]);

  return (
    <div ref={ref} className="grid md:grid-cols-[1fr_auto_1fr] gap-5 items-center">
      <Card className="p-6">
        <span className="text-xs font-medium uppercase tracking-widest text-accent">Visitor on your site</span>
        <div className="mt-4 rounded-xl rounded-bl-sm bg-foreground text-background px-4 py-3 text-[15px] min-h-[52px]">
          {typed ? `"${typed}"` : ""}
          {!reduce && typed.length < phrase.length && (
            <span className="inline-block w-0.5 h-[1em] align-[-2px] bg-accent animate-pulse ml-0.5" />
          )}
        </div>
      </Card>

      <motion.div
        aria-hidden="true"
        className="text-accent text-2xl text-center rotate-90 md:rotate-0"
        animate={reduce ? {} : { x: [0, 7, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
      >
        →
      </motion.div>

      <Card className="p-6">
        <span className="text-xs font-medium uppercase tracking-widest text-accent">Sunny → your catalog</span>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={routed ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE }}
          className="mt-4 flex items-center gap-3 rounded-lg border border-border p-3"
        >
          <img src={getSlotUrl("compound-bpc-157")} alt="" width={56} height={40}
               className="w-14 h-10 rounded object-cover flex-none" loading="lazy" />
          <span>
            <span className="block font-semibold text-[15px]">BPC-157</span>
            <span className="block text-xs text-muted-foreground">yourbrand.com/store</span>
          </span>
        </motion.div>
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={routed ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-3 flex gap-2 text-sm text-muted-foreground"
        >
          <Check className="w-4 h-4 text-accent flex-none mt-0.5" />
          Research summary, conditional language, your product page.
        </motion.p>
      </Card>
    </div>
  );
}

export default function PartnerPage() {
  const reduce = useReducedMotion();
  const partnerHeroUrl = getSlotUrl("partner-hero");
  const partnerHero2xUrl = getSlotUrl("partner-hero", "2x");
  const partnerHeroRecommended = getSlotDef("partner-hero")?.variants.base?.recommended;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pb-28 px-4 hero-gradient">
        <div className="absolute inset-0 z-0"><ParticleBackground /></div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={reduce ? false : { opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground mb-6"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Sunny for brands
              </motion.div>

              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
                className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-[1.05]"
              >
                The research desk your customers{" "}
                <span className="bg-gradient-to-r from-accent via-accent/80 to-accent/60 bg-clip-text text-transparent">
                  keep asking for
                </span>
              </motion.h1>

              <motion.p
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
                className="text-lg text-muted-foreground max-w-xl mb-8"
              >
                Your buyers arrive with questions your product pages can't answer. Sunny reads the
                literature on your catalog and explains it — in your brand's voice, without ever prescribing.
              </motion.p>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
                className="flex flex-wrap gap-3"
              >
                <Button size="lg" asChild>
                  <a href="/contact" className="group">
                    Book a call
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#guardrails">See the guardrails</a>
                </Button>
              </motion.div>

              <motion.p
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="mt-6 text-xs text-muted-foreground"
              >
                Educational content · Not medical advice · For adults 21+
              </motion.p>
            </motion.div>

            {/* Labeled vial: the brand's own object, carrying the partner's name */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 40, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
              className="flex justify-center"
            >
              <motion.div
                animate={reduce ? {} : { y: [0, -14, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full max-w-lg aspect-[8/5] rounded-2xl shadow-2xl overflow-hidden"
              >
                {partnerHeroUrl ? (
                  <img
                    src={partnerHeroUrl}
                    srcSet={partnerHero2xUrl ? `${partnerHeroUrl} 1200w, ${partnerHero2xUrl} 2400w` : undefined}
                    sizes="(max-width: 1024px) 100vw, 520px"
                    width={1200}
                    height={750}
                    fetchPriority="high"
                    decoding="async"
                    alt="Sunny, white-labeled with a partner brand's own identity"
                    className="w-full h-full object-cover rounded-2xl shadow-2xl"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/40 text-xs text-muted-foreground text-center px-4">
                    {partnerHeroRecommended
                      ? `Recommended: ${partnerHeroRecommended.width} × ${partnerHeroRecommended.height}`
                      : "No image yet"}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── COMPOUND MARQUEE ───────────────────────────────── */}
      <div className="relative overflow-hidden border-y border-border bg-secondary/25 py-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-10 bg-gradient-to-l from-background to-transparent" />
        <motion.div
          className="flex gap-12 w-max"
          animate={reduce ? {} : { x: ["0%", "-50%"] }}
          transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
        >
          {[...compounds, ...compounds].map((c, i) => (
            <span key={i} className="text-xs uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
              {c}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── CAPABILITIES ───────────────────────────────────── */}
      <section className="py-24 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-7xl">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Not a chatbot. A reading of the literature.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Most peptide buyers have spent months in forum threads and contradictory videos. Sunny replaces
              that with sourced research, organized around what they came to understand.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {capabilities.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.1}>
                <Card className="p-6 h-full flex flex-col hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-5">
                    <c.icon className="w-5 h-5 text-accent" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{c.title}</h3>
                  <p className="text-muted-foreground">{c.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROUTING ────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Every answer stays inside your store.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              When Sunny surfaces research on a compound, it links to your product page. The conversation ends
              on your domain, not somewhere else.
            </p>
          </Reveal>
          <Reveal><RoutingDemo /></Reveal>
        </div>
      </section>

      {/* ── GUARDRAILS ─────────────────────────────────────── */}
      <section id="guardrails" className="py-24 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-7xl">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              The refusals are the product.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              An AI that recommends protocols is a liability with a chat bubble on it. Sunny is built to
              decline — and every refusal is written, reviewed, and shown to you before launch.
            </p>
          </Reveal>

          <div className="space-y-3">
            {guardrails.map((g, i) => (
              <Reveal key={g.title} delay={i * 0.08}>
                <Card className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 transition-colors hover:bg-secondary/25">
                  <div className="flex items-center gap-4 sm:w-72 flex-none">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-none">
                      <g.icon className="w-4.5 h-4.5 text-accent" strokeWidth={1.5} />
                    </div>
                    <span className="text-lg font-semibold">{g.title}</span>
                  </div>
                  <p className="text-muted-foreground">{g.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <p className="mt-8 text-sm text-muted-foreground">
              You review the full refusal set during onboarding and can tighten it further.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── PLANS ──────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Two ways to run it.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Both go live in under a week.</p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            <Reveal>
              <Card className="p-8 h-full flex flex-col">
                <span className="text-xs font-medium uppercase tracking-widest text-accent">Embedded</span>
                <h3 className="text-xl font-semibold mt-3">Sunny, as Sunny</h3>
                <p className="text-muted-foreground mt-2.5">
                  The same assistant, embedded on your site and trained on your catalog, carrying a small
                  "Powered by Sunny" mark.
                </p>
                {/* TODO: replace with the real figure */}
                <div className="mt-6 text-4xl font-bold tracking-tight">
                  <span className="border border-dashed border-accent text-accent rounded px-2.5 py-0.5 text-base align-middle">price</span>
                  <span className="text-base font-medium text-muted-foreground ml-2">/month</span>
                </div>
                <ul className="mt-6 mb-8 space-y-0">
                  {["Trained on your full catalog", "One-line install", "Custom intake flow", "Lead capture to your CRM", "Monthly conversation report"].map((f) => (
                    <li key={f} className="flex gap-3 py-3 border-b border-border text-[15px]">
                      <Check className="w-4 h-4 text-accent flex-none mt-1" />{f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-auto w-full" asChild>
                  <a href="/contact">Book a call</a>
                </Button>
              </Card>
            </Reveal>

            <Reveal delay={0.12}>
              <Card className="p-8 h-full flex flex-col relative border-accent/40 shadow-lg">
                <span className="absolute -top-3 left-8 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
                  Make it yours
                </span>
                <span className="text-xs font-medium uppercase tracking-widest text-accent">White-label</span>
                <h3 className="text-xl font-semibold mt-3">Your name on it</h3>
                <p className="text-muted-foreground mt-2.5">
                  Rename it, restyle it, run it on your own subdomain. Customers see your brand and nothing else.
                </p>
                {/* TODO: replace with the real figure */}
                <div className="mt-6 text-4xl font-bold tracking-tight">
                  <span className="border border-dashed border-accent text-accent rounded px-2.5 py-0.5 text-base align-middle">custom</span>
                </div>
                <ul className="mt-6 mb-8 space-y-0">
                  {["Everything in Embedded", "Custom name, persona, avatar", "Your colors, fonts, and voice", "Your subdomain", "No Sunny badge", "Dedicated account manager"].map((f) => (
                    <li key={f} className="flex gap-3 py-3 border-b border-border text-[15px]">
                      <Check className="w-4 h-4 text-accent flex-none mt-1" />{f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-auto w-full group" asChild>
                  <a href="/contact">
                    Talk to us
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── LAUNCH ─────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <Reveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              From call to live in five days.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From first call to first conversation on your site.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {launchSteps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <Card className="p-8 h-full">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl font-bold text-accent/30">{s.n}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                      <p className="text-muted-foreground">{s.body}</p>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ────────────────────────────────────── */}
      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <Reveal>
            <div className="gradient-desert rounded-2xl px-6 py-16 sm:px-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/40 text-xs font-medium text-foreground mb-6">
                <ShieldCheck className="w-3.5 h-3.5" />
                Limited onboarding slots · Live in 5 days
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-2xl mx-auto mb-4">
                Your customers are already asking. Someone should answer.
              </h2>
              <p className="text-foreground/75 max-w-2xl mx-auto">
                Tell us what you carry and who buys it. We'll show you the conversations Sunny would have on
                your site — before you commit to anything.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-8">
                <Button size="lg" variant="secondary" asChild>
                  <a href="/contact" className="group">
                    Book a call
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-foreground/30" asChild>
                  <a href="#guardrails">Read the guardrails</a>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
