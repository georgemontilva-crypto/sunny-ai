import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-2">Last updated: July 29, 2026</p>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-muted-foreground leading-relaxed">
            These Terms of Service govern access to and use of the Sunny website ("the Service"). By using
            this site you accept these terms. If you disagree, please do not continue using the Service.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Nature of the Service</h2>
            <p>
              Sunny is an informational site that publishes educational and research content about
              peptides. We do not sell compounds, operate an online store, or provide medical services.
              The published content (articles, compound library, form responses) is exclusively for
              educational and research purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Permitted use</h2>
            <p>
              You may use this site to inform yourself. You must not use it to obtain dosing guidance,
              diagnosis, or treatment for any medical condition, nor as a substitute for the judgment of a
              qualified health professional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Minimum age</h2>
            <p>
              Access to this site and use of the contact form are intended for people 21 years of age or
              older. If you are under 21, please do not submit information through our forms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. No medical advice</h2>
            <p>
              Nothing on this site constitutes medical advice. Sunny does not diagnose, treat, cure, or
              prevent any disease. Always consult a qualified health professional before making any
              decision related to your health.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Limitation of liability</h2>
            <p>
              Sunny assumes no responsibility for decisions you make based on the content of this site. Use
              of the information published here is at your own risk and judgment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Intellectual property</h2>
            <p>
              Sunny's content, design, and brand are protected by copyright. Reproducing this site's
              content without prior authorization is not permitted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Changes to these terms</h2>
            <p>
              We may update these terms occasionally. Changes take effect as soon as they are published on
              this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
            <p>
              For questions about these terms, reach out through our{" "}
              <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/legal/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          <Link href="/legal/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
        </div>
      </div>
    </div>
  );
}
