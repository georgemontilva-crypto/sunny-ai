import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-2">Last updated: July 29, 2026</p>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Legal Disclaimer</h1>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
          <p>
            All content published by Sunny —including the compound library, the blog, and responses
            generated through this site— is provided for <strong>educational and research purposes
            only</strong>.
          </p>
          <p>
            Sunny <strong>does not offer medical advice</strong> and does not diagnose or prescribe any
            treatment, compound, or protocol. The information presented here summarizes available
            scientific literature and should not be interpreted as a recommendation for use.
          </p>
          <p>
            This site is intended for <strong>people 21 years of age or older</strong>. Access or use by
            anyone under that age is not authorized.
          </p>
          <p>
            Before making any decision related to your health, always consult a{" "}
            <strong>qualified health professional</strong>. No decision you make based on the content of
            this site creates liability for Sunny.
          </p>
          <p>
            Sunny is operated by <strong>Brighter Days Labs (BDL)</strong>. The compounds featured on this
            site are research products sold by BDL, offered strictly for laboratory and research use —
            not for human consumption. Any decision to acquire, use, or research a compound mentioned on
            this site is the user's sole responsibility.
          </p>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/legal/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
        </div>
      </div>
    </div>
  );
}
