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
          <p className="text-sm text-muted-foreground mb-2">Last updated: August 3, 2026</p>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground leading-relaxed">
            At Sunny we care about how your information is handled. This policy explains what data we
            collect through this site — including if you create an account — and how we use it.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. What information we collect</h2>
            <p>
              Through the contact form: name, email address, research goal, and the message you write.
            </p>
            <p className="mt-3">
              If you create an account: your name, email address, and a hashed version of your password —
              we never store your password itself, only a one-way hash it's not possible to reverse. Once
              you're signed in, we also store the conversations you have with Sunny, so you can pick a
              conversation back up and so you can review or delete what you've shared.
            </p>
            <p className="mt-3">
              To keep you signed in, we also set a session cookie that stores a random session identifier —
              see our{" "}
              <Link href="/legal/cookies" className="text-primary hover:underline">
                Cookie Policy
              </Link>{" "}
              for what it stores and how long it lasts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How long we keep it, and how to delete it</h2>
            <p>
              Account and conversation data is kept for as long as your account exists. You control both,
              at any time, from your{" "}
              <Link href="/account" className="text-primary hover:underline">
                account page
              </Link>
              : you can delete your conversation history while keeping your account, or delete the account
              entirely — which permanently removes your account and every conversation tied to it in the
              same action. Both are real deletions, not a deactivation flag: once deleted, the data is
              gone, immediately, and we can't recover it for you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How we use your information</h2>
            <p>
              Contact-form data is used solely to respond to your inquiry. Account data is used to run
              your account — signing you in, and showing Sunny your own conversation history back to you.
              We do not sell or share your information with third parties for commercial purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Where the form is processed</h2>
            <p>
              The contact form sends your message to an external service that handles email delivery. We
              do not store contact-form messages in a database of our own — account and conversation data
              is stored in our own database, described above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Your rights</h2>
            <p>
              For contact-form data, you can request at any time that we delete the information you've
              sent us by writing to us through the contact page. For account and conversation data, delete
              it yourself, immediately, from your{" "}
              <Link href="/account" className="text-primary hover:underline">
                account page
              </Link>{" "}
              — no request needed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Changes to this policy</h2>
            <p>We may update this policy occasionally. Changes take effect as soon as they're published here.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Contact</h2>
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
