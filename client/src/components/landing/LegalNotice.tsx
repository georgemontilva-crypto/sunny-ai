import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle } from "lucide-react";

// Rendered inside Contact.tsx, as a full-width dark band below the form —
// not a standalone <section>, so it shares Contact's outer container.
export default function LegalNotice() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-[calc(var(--radius)+8px)] bg-noche text-background border border-background/10 shadow-[0_34px_74px_-44px_rgba(0,0,0,0.7)]"
      style={{ padding: "clamp(28px, 4vw, 42px)" }}
    >
      <div
        className="warm-glow"
        style={{ width: 640, height: 640, top: -260, right: -140 }}
        aria-hidden="true"
      />
      <div className="hero-grain" aria-hidden="true" />

      <div className="relative z-[2] grid grid-cols-[52px_1fr] gap-[22px] items-start">
        <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-accent bg-accent/13 border border-accent/26">
          <AlertTriangle className="w-[22px] h-[22px]" strokeWidth={1.7} />
        </div>
        <div>
          <h3 className="text-[22px] font-semibold mb-4">Important notice</h3>
          <div className="grid grid-cols-2 max-[820px]:grid-cols-1 gap-[26px] max-[820px]:gap-3.5">
            <p className="text-sm text-background/62 leading-[1.65]">
              Sunny provides educational summaries of published research. It does not provide medical
              advice, diagnosis, treatment recommendations, dosing instructions, or protocols. Always
              consult a qualified healthcare professional before making health-related decisions.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-background/62 leading-[1.65]">
                All content on Sunny — including the compound library, blog, and responses to
                contact-form inquiries — is provided for{" "}
                <strong className="text-background/92 font-semibold">educational and research purposes
                only</strong>. Sunny <strong className="text-background/92 font-semibold">does not provide
                medical advice</strong> and does not diagnose or prescribe any treatment, compound, or
                protocol.
              </p>
              <p className="text-sm text-background/62 leading-[1.65]">
                This site is intended for{" "}
                <strong className="text-background/92 font-semibold">adults 21 and older</strong>. Sunny
                assumes no responsibility for decisions made based on this content.
              </p>
            </div>
          </div>
          <Link href="/legal/disclaimer" className="inline-block mt-[18px] text-accent font-medium text-sm">
            Read the full legal disclaimer →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
