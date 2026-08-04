import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Book, FileText, FlaskConical, Info, Send, ShieldCheck } from "lucide-react";
import SectionHead from "@/components/landing/SectionHead";
import { cn } from "@/lib/utils";

interface QAItem {
  q: string;
  a: string;
  citation?: { title: string; meta: string };
  product?: { name: string; subtitle: string; url: string };
}

// Eight real question/answer pairs pulled from this site's own content
// (FAQ, compound library, legal disclaimer) — two are deliberately negative
// ("Can you tell me what to take?", "Why don't you give dosing?") because
// that refusal is exactly what Sunny is for.
const QA: QAItem[] = [
  {
    q: "What does the research say about tissue repair?",
    a: "BPC-157 and TB-500 are the compounds that appear most often in that literature. Both are studied largely in animal models — tendon, ligament and gastrointestinal tissue for BPC-157; wound healing and cellular motility for TB-500. Neither has published randomized controlled trials in humans.",
    citation: { title: "BPC-157 · TB-500", meta: "Preclinical · Animal models · No RCTs published" },
  },
  {
    q: "How is GHK-Cu different from the others?",
    a: "It's the one with the most human data. GHK-Cu is a copper complex of a tripeptide that occurs naturally in plasma and declines with age. Most published work is in dermatology — skin regeneration and collagen synthesis — and some of it is clinical rather than preclinical.",
    citation: { title: "GHK-Cu", meta: "Dermatology · Human data available" },
    product: {
      name: "GHK-Cu · 50 mg",
      subtitle: "Available from Brighter Days Labs",
      url: "https://www.brighterdayslabs.com/compounds/ghk-cu-50mg",
    },
  },
  {
    q: "Can you tell me what to take?",
    a: "No. I don't diagnose, prescribe, or recommend protocols. What I can do is organize the published research on a topic so you can bring it to a licensed clinician who knows your situation.",
  },
  {
    q: "Why don't you give dosing?",
    a: "Because it isn't information that's mine to give. Dosing is a clinical decision that depends on the individual, and only a qualified health professional can assess it. You'll never find a dose or a protocol here.",
  },
  {
    q: "What's studied for cognition?",
    a: "Semax comes up most often — a synthetic heptapeptide studied in preclinical models for effects on cognitive function and neuroprotection. The evidence base is mostly animal work; human data is limited.",
    citation: { title: "Semax", meta: "Preclinical models · Limited human data" },
  },
  {
    q: "What about metabolism?",
    a: "MOTS-c is the one to look at. It's derived from mitochondrial DNA, and preclinical studies explore its role in energy metabolism and insulin sensitivity. Again — preclinical. That's the honest framing.",
    citation: { title: "MOTS-c", meta: "Preclinical · Energy metabolism" },
    product: {
      name: "MOTS-c · 10 mg",
      subtitle: "Available from Brighter Days Labs",
      url: "https://www.brighterdayslabs.com/compounds/mots-c-10mg",
    },
  },
  {
    q: "Do you sell peptides?",
    a: "No. I don't sell, manufacture, or distribute any compound — I publish educational summaries of available scientific literature. The compounds discussed here are research products sold by Brighter Days Labs, which operates Sunny.",
    product: {
      name: "Research compounds",
      subtitle: "Available from Brighter Days Labs",
      url: "https://www.brighterdayslabs.com/",
    },
  },
  {
    q: "How do you pick what to include?",
    a: "I prioritize compounds with published, verifiable literature — preclinical or clinical — and I say which it is on every entry. When the evidence is weak or nonexistent, that gets said too.",
  },
];

const GREETING = "Hi — I'm Sunny. Ask me about a compound or a research topic, or pick one of the questions below.";

interface Bubble {
  id: number;
  role: "user" | "assistant";
  text?: string;
  citation?: QAItem["citation"];
  product?: QAItem["product"];
  typing?: boolean;
}

let bubbleSeq = 0;
const nextBubbleId = () => ++bubbleSeq;

function greetingBubble(): Bubble {
  return { id: nextBubbleId(), role: "assistant", text: GREETING };
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

function ProductCard({ name, subtitle, url }: NonNullable<QAItem["product"]>) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="mt-[11px] flex items-center gap-3 px-[13px] py-[11px] rounded-[11px] border border-accent/34 bg-accent/9 no-underline transition-all duration-300 hover:bg-accent/16 hover:border-accent/60 hover:translate-x-[3px]"
    >
      <span className="w-[34px] h-[34px] rounded-lg shrink-0 flex items-center justify-center bg-accent/16 text-accent">
        <FlaskConical className="w-4 h-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-semibold text-background/92">{name}</span>
        <span className="block font-mono text-[9.5px] tracking-[.07em] uppercase text-background/45 mt-0.5">
          {subtitle}
        </span>
      </span>
      <ArrowUpRight className="w-[15px] h-[15px] text-accent shrink-0" />
    </a>
  );
}

function CitationCard({ title, meta }: NonNullable<QAItem["citation"]>) {
  return (
    <div className="mt-[13px] grid grid-cols-[auto_1fr] gap-[11px] items-start border border-accent/28 bg-accent/7 rounded-[11px] px-[14px] py-3">
      <FileText className="w-[15px] h-[15px] text-accent mt-0.5" />
      <div>
        <div className="text-[12.5px] font-semibold text-background/90 leading-[1.4]">{title}</div>
        <div className="font-mono text-[9.5px] tracking-[.06em] uppercase text-background/45 mt-1">{meta}</div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-[18px] py-[15px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-background/50"
          style={{ animation: "chat-typing-dot 1.3s ease-in-out infinite", animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}

function ChatBubble({ role, text, citation, product, typing }: Bubble) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("flex gap-3 items-start", isUser && "flex-row-reverse")}
    >
      <span
        className={cn(
          "w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-mono text-[10px] font-semibold",
          isUser ? "bg-background/10 text-background/60" : "text-noche"
        )}
        style={
          isUser
            ? undefined
            : {
                background: "linear-gradient(150deg, var(--accent), oklch(0.62 0.14 62))",
                boxShadow: "0 0 16px -3px oklch(from var(--accent) l c h / 70%)",
              }
        }
      >
        {isUser ? "YOU" : "S"}
      </span>
      <div
        className={cn(
          "max-w-[78%] max-[600px]:max-w-[88%] rounded-[15px] text-[14.5px] leading-[1.55]",
          isUser
            ? "bg-accent text-noche font-medium rounded-br-[5px]"
            : "bg-background/7 text-background/88 border border-background/10 rounded-bl-[5px]"
        )}
      >
        {typing ? (
          <TypingDots />
        ) : (
          <div className="px-4 py-[13px]">
            {text}
            {product && <ProductCard {...product} />}
            {citation && <CitationCard {...citation} />}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatDemo() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const convRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const [messages, setMessages] = useState<Bubble[]>(() => [greetingBubble()]);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    convRef.current?.scrollTo({ top: convRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function respond(i: number) {
    if (usedIndices.has(i)) return;
    const item = QA[i];
    setUsedIndices((prev) => new Set(prev).add(i));
    setMessages((prev) => [...prev, { id: nextBubbleId(), role: "user", text: item.q }]);

    if (reducedMotion) {
      setMessages((prev) => [
        ...prev,
        { id: nextBubbleId(), role: "assistant", text: item.a, citation: item.citation, product: item.product },
      ]);
      return;
    }

    const typingId = nextBubbleId();
    setMessages((prev) => [...prev, { id: typingId, role: "assistant", typing: true }]);
    const delay = 900 + Math.random() * 500;
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { id: typingId, role: "assistant", text: item.a, citation: item.citation, product: item.product }
            : m
        )
      );
    }, delay);
  }

  function handleReset() {
    setMessages([greetingBubble()]);
    setUsedIndices(new Set());
  }

  return (
    <section id="chat" className="py-24 px-4 bg-noche relative overflow-hidden" ref={sectionRef}>
      <div
        className="hero-light"
        style={{
          width: 1000,
          height: 1000,
          top: "-20%",
          left: "calc(50% - 500px)",
          background: "radial-gradient(circle, oklch(from var(--accent) l c h / 17%), transparent 62%)",
          animation: "hero-drift-3 22s ease-in-out infinite",
        }}
        aria-hidden="true"
      />
      <div className="hero-grain" aria-hidden="true" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <SectionHead
          dark
          eyebrow="AI research assistant"
          title="Chat with"
          accentTitle="Sunny"
          note="Ask questions in plain language. Sunny organizes published research around your topic — no diagnosis, no protocols."
        />

        <div className="relative">
          <span className="chat-badge chat-badge-1 flex items-center gap-2 px-[15px] py-[9px] rounded-full bg-noche/62 backdrop-blur-[16px] border border-background/15 text-[12.5px] text-background/80 shadow-[0_12px_32px_-14px_rgba(0,0,0,0.8)]">
            <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
            No dosing, ever
          </span>
          <span className="chat-badge chat-badge-2 flex items-center gap-2 px-[15px] py-[9px] rounded-full bg-noche/62 backdrop-blur-[16px] border border-background/15 text-[12.5px] text-background/80 shadow-[0_12px_32px_-14px_rgba(0,0,0,0.8)]">
            <Book className="w-3.5 h-3.5 text-accent shrink-0" />
            Every claim cited
          </span>
          <span className="chat-badge chat-badge-3 flex items-center gap-2 px-[15px] py-[9px] rounded-full bg-noche/62 backdrop-blur-[16px] border border-background/15 text-[12.5px] text-background/80 shadow-[0_12px_32px_-14px_rgba(0,0,0,0.8)]">
            <Info className="w-3.5 h-3.5 text-accent shrink-0" />
            Redirects to clinicians
          </span>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-[960px] mx-auto rounded-[18px] overflow-hidden relative border border-background/13 shadow-[0_60px_120px_-50px_rgba(0,0,0,0.9),0_0_90px_-30px_oklch(from_var(--accent)_l_c_h/30%),inset_0_1px_0_oklch(from_var(--background)_l_c_h/9%)]"
            style={{ background: "linear-gradient(180deg, oklch(0.19 0.018 76), oklch(0.16 0.015 76))" }}
          >
            <div className="flex items-center gap-3.5 px-[18px] py-[13px] border-b border-background/10 bg-background/3">
              <span className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full bg-background/18" />
                ))}
              </span>
              <span className="flex-1 text-center font-mono text-[11px] text-background/38 bg-background/5 rounded-full px-3.5 py-[5px] max-w-[280px] mx-auto">
                sunny · research assistant
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 font-mono text-[11.5px] tracking-[.1em] uppercase text-background/38 hover:text-accent transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="grid grid-cols-[212px_1fr] max-[760px]:grid-cols-1">
              <aside className="max-[760px]:hidden border-r border-background/10 bg-background/2 px-3.5 py-[18px]">
                <h5 className="font-mono text-[9.5px] tracking-[.14em] uppercase text-background/35 font-medium mb-3">
                  Recent
                </h5>
                <div className="block text-[13px] px-2.5 py-2 rounded-lg mb-0.5 bg-accent/14 text-accent">
                  Tissue repair evidence
                </div>
                <div className="block text-[13px] px-2.5 py-2 rounded-lg mb-0.5 text-background/55 truncate">
                  GHK-Cu in dermatology
                </div>
                <div className="block text-[13px] px-2.5 py-2 rounded-lg mb-0.5 text-background/55 truncate">
                  Sleep architecture studies
                </div>
                <div className="block text-[13px] px-2.5 py-2 rounded-lg mb-0.5 text-background/55 truncate">
                  Mitochondrial peptides
                </div>
                <h5 className="font-mono text-[9.5px] tracking-[.14em] uppercase text-background/35 font-medium mt-5 mb-3">
                  Topics
                </h5>
                <div className="block text-[13px] px-2.5 py-2 rounded-lg mb-0.5 text-background/55">Recovery</div>
                <div className="block text-[13px] px-2.5 py-2 rounded-lg mb-0.5 text-background/55">Longevity</div>
                <div className="block text-[13px] px-2.5 py-2 rounded-lg mb-0.5 text-background/55">Cognition</div>
              </aside>

              <div>
                <div
                  ref={convRef}
                  className="px-7 max-[600px]:px-4 pt-[26px] pb-5 flex flex-col gap-[18px] overflow-y-auto scroll-smooth max-h-[420px] max-[600px]:max-h-[320px] min-h-[400px] max-[600px]:min-h-[280px]"
                >
                  {messages.map((m) => (
                    <ChatBubble key={m.id} {...m} />
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 px-7 pb-[18px] ml-[44px] max-[760px]:ml-0 max-[760px]:px-4 max-[760px]:overflow-x-auto max-[760px]:flex-nowrap">
                  {QA.map((item, i) => (
                    <button
                      key={item.q}
                      type="button"
                      disabled={usedIndices.has(i)}
                      onClick={() => respond(i)}
                      className={cn(
                        "text-[12.5px] px-[13px] py-[14px] rounded-full border border-background/16 text-background/55 transition-all duration-300 shrink-0",
                        usedIndices.has(i)
                          ? "opacity-30 pointer-events-none"
                          : "cursor-pointer hover:border-accent/50 hover:text-accent"
                      )}
                    >
                      {item.q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 px-5 py-[15px] border-t border-background/10 bg-background/3">
              <input
                type="text"
                placeholder="Ask Sunny about peptides…"
                disabled
                className="flex-1 px-4 py-[11px] rounded-full text-sm bg-background/5 border border-background/13 text-background/50 placeholder:text-background/50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled
                className="w-[42px] h-[42px] rounded-full bg-accent text-noche flex items-center justify-center opacity-55 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>

        <p className="text-center text-xs text-background/40 mt-[22px]">Illustrative example</p>
      </div>
    </section>
  );
}
