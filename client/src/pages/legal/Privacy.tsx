import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-2">Last updated: July 29, 2026</p>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground leading-relaxed">
            At Sunny we care about how your information is handled. This policy explains what data we
            collect through this site and how we use it.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. What information we collect</h2>
            <p>
              We only collect the data you voluntarily submit through the contact form: name, email
              address, research goal, and the message you write. We don't use user accounts or login
              systems — this site is informational and doesn't require registration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How we use your information</h2>
            <p>
              We use the form data solely to respond to your inquiry. We do not sell or share your
              information with third parties for commercial purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Where the form is processed</h2>
            <p>
              The contact form sends your message to an external service that handles email delivery. We
              do not store your message in a database of our own.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Your rights</h2>
            <p>
              You can request at any time that we delete the information you've sent us by writing to us
              through the contact page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Changes to this policy</h2>
            <p>We may update this policy occasionally. Changes take effect as soon as they're published here.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Contact</h2>
            <p>
              For privacy questions, reach out through our{" "}
              <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/legal/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          <Link href="/legal/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
        </div>
      </div>
    </div>
  );
}
