import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

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

export default function ChatDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-4 bg-background" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Chat with Sunny
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Natural conversations about your health goals. Sunny analyzes research and maps peptide pathways tailored to you.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="max-w-2xl mx-auto bg-card border border-border rounded-2xl overflow-hidden shadow-lg"
        >
          <div className="bg-gradient-to-r from-accent/10 to-accent/5 p-4 border-b border-border">
            <h3 className="font-semibold text-sm">Sunny AI Research Assistant</h3>
          </div>

          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-background">
            {chatMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
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

        <p className="text-center text-xs text-muted-foreground mt-4">Illustrative example</p>
      </div>
    </section>
  );
}

