import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import SectionHead from "@/components/landing/SectionHead";
import { getSlotUrl } from "@/lib/media";

const chatMessages = [
  {
    type: "user",
    text: "How do you decide what research to show me?",
  },
  {
    type: "assistant",
    text: "I start from your goal, then map it to the peer-reviewed literature — what's been studied, in which models, and where the evidence runs out.",
  },
  {
    type: "user",
    text: "So can you tell me what to take?",
  },
  {
    type: "assistant",
    text: "No. I don't diagnose, prescribe, or recommend protocols. I organize published research so you can bring it to a licensed clinician.",
  },
];

const TYPING_MIN_MS = 900;
const TYPING_MAX_MS = 1400;
const MS_PER_CHAR = 35;
const MAX_MESSAGE_DELAY_MS = 2500;
const CYCLE_PAUSE_MS = 4000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const messageDelay = (text: string) => Math.min(MAX_MESSAGE_DELAY_MS, text.length * MS_PER_CHAR);

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start"
    >
      <div className="max-w-xs px-4 py-3 rounded-lg bg-secondary text-foreground rounded-bl-none flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function ChatDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const scrollRef = useRef<HTMLDivElement>(null);

  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setVisibleCount(chatMessages.length);
      return;
    }

    let cancelled = false;

    const runCycle = async () => {
      while (!cancelled) {
        setVisibleCount(0);
        setIsTyping(false);

        for (let i = 0; i < chatMessages.length; i++) {
          const msg = chatMessages[i];
          if (msg.type === "assistant") {
            setIsTyping(true);
            await wait(TYPING_MIN_MS + Math.random() * (TYPING_MAX_MS - TYPING_MIN_MS));
            if (cancelled) return;
            setIsTyping(false);
          } else {
            await wait(messageDelay(msg.text));
          }
          if (cancelled) return;
          setVisibleCount(i + 1);
        }

        await wait(CYCLE_PAUSE_MS);
      }
    };

    runCycle();
    return () => {
      cancelled = true;
    };
  }, [isInView]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleCount, isTyping]);

  return (
    <section id="chat" className="py-24 px-4 bg-noche relative overflow-hidden" ref={ref}>
      <div
        className="hero-light"
        style={{
          width: 1000,
          height: 1000,
          top: "-20%",
          // Centered via a computed offset rather than left:50% +
          // transform:translateX(-50%) — the drift keyframes animate
          // `transform` too, and an animated transform fully replaces a
          // static one rather than composing with it, which would silently
          // drop the centering the moment the animation starts.
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

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="max-w-2xl mx-auto bg-card border border-border rounded-[20px] overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-r from-accent/10 to-accent/5 p-4 border-b border-border flex items-center gap-2">
            <img src={getSlotUrl("logo")} alt="Sunny" className="h-10 w-auto" loading="lazy" />
            <h3 className="font-semibold text-sm">AI Research Assistant</h3>
          </div>

          <div ref={scrollRef} className="h-96 overflow-y-auto p-6 space-y-4 bg-background">
            {chatMessages.slice(0, visibleCount).map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-lg ${
                    msg.type === "user"
                      ? "bg-accent text-white rounded-br-none"
                      : "bg-secondary text-foreground rounded-bl-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </motion.div>
            ))}
            {isTyping && <TypingIndicator />}
          </div>

          <div className="p-4 border-t border-border bg-secondary/50">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask Sunny about peptides..."
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              />
              <button
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent"
                disabled
              >
                Send
              </button>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-background/40 mt-4">Illustrative example</p>
      </div>
    </section>
  );
}
