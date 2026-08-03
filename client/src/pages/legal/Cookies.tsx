import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-2">Last updated: August 3, 2026</p>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground leading-relaxed">
            Sunny sets one cookie to keep you signed in if you have an account. We don't use advertising or
            third-party tracking cookies.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. The cookies we set</h2>
            <p>
              If you sign in — as a Sunny member, or separately as staff through the admin panel — we set a
              session cookie (<code>sunny_member_session</code> or <code>sunny_session</code>, depending
              which) so you stay signed in as you move between pages. It stores only a random session
              identifier, never your email, password, or any other personal data, and is checked against
              your session in our database on every request. It expires automatically 8 hours after you
              sign in, and we delete it immediately when you sign out.
            </p>
            <p className="mt-3">
              If you never create an account or sign in, this site sets no cookies of its own. We have no
              shopping carts or advertising tracking.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Local storage</h2>
            <p>
              Your browser may save local preferences (like the dismissed state of a banner) using{" "}
              <code>localStorage</code>. This information stays on your device and is never sent to our
              servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Changes to this policy</h2>
            <p>If we add analytics or third-party cookies in the future, we'll update this page.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Contact</h2>
            <p>
              For questions, reach out through our{" "}
              <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/legal/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
        </div>
      </div>
    </div>
  );
}
