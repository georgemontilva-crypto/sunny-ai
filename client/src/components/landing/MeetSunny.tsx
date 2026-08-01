import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, FileText, Zap, Target } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Natural conversations",
    description: "Chat naturally about your health goals",
  },
  {
    icon: FileText,
    title: "Lab report analysis",
    description: "Upload and analyze your biomarkers",
  },
  {
    icon: Zap,
    title: "Smart research mapping",
    description: "AI-powered peptide recommendations",
  },
  {
    icon: Target,
    title: "Personalized pathways",
    description: "Tailored protocols for your goals",
  },
];

export default function MeetSunny() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-4 bg-secondary/30" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* LEFT SIDE - TEXT CONTENT */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-accent mb-6"
            >
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              YOUR AI CONSULTANT
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-6"
            >
              Meet{" "}
              <span className="bg-gradient-to-r from-accent via-accent/80 to-accent/60 bg-clip-text text-transparent">
                Sunny
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="text-lg text-muted-foreground mb-8 max-w-lg"
            >
              She's not a chatbot. She's a structured AI research assistant who conducts a professional intake — understanding your goals, biology, and experience before mapping the perfect peptide pathway.
            </motion.p>

            {/* FEATURES GRID */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="grid grid-cols-2 gap-4 mb-10"
            >
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                  className="flex items-start gap-3"
                >
                  <div className="flex-shrink-0 mt-1">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Button size="lg" className="text-base font-semibold px-8 h-12">
                Start Conversation
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base font-medium px-8 h-12"
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE - IMAGE PLACEHOLDER */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="relative h-96 lg:h-full min-h-96"
          >
            {/* SUNNY PROFILE IMAGE PLACEHOLDER - 600x700px */}
            <motion.div
              className="bg-gradient-to-br from-accent/20 via-accent/10 to-gray-300 w-full h-full rounded-3xl flex items-center justify-center text-gray-600 shadow-2xl overflow-hidden border-2 border-accent/20"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-accent/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-5xl">✨</span>
                </div>
                <div className="font-bold text-lg">600 × 700px</div>
                <div className="text-sm mt-2">Sunny Profile Image</div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
