import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function LegalNotice() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-16 px-4 bg-background" ref={ref}>
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Card className="p-8 border-accent/30">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-3">Important notice</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  All content on Sunny —compound library, blog, and contact form responses— is
                  provided for <strong className="text-foreground">educational and research purposes
                  only</strong>. Sunny <strong className="text-foreground">does not provide medical
                  advice</strong> and does not diagnose or prescribe any treatment, compound, or protocol.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  This site is intended for <strong className="text-foreground">adults 21 and
                  older</strong>. Always consult a <strong className="text-foreground">qualified health
                  professional</strong> before making any decision related to your health. Sunny assumes
                  no responsibility for decisions made based on this content.
                </p>
                <Link href="/legal/disclaimer" className="text-sm text-accent hover:underline font-medium">
                  Read the full legal disclaimer →
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
