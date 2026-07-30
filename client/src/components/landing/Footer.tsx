import { useState } from "react";
import { Link } from "wouter";

const NEWSLETTER_ENDPOINT = import.meta.env.VITE_NEWSLETTER_ENDPOINT as string | undefined;

type Status = "idle" | "sending" | "sent" | "error";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot — real visitors never fill this hidden field.
    if (website) return;

    if (!isValidEmail(email)) {
      setStatus("error");
      setErrorMsg("Enter a valid email address.");
      return;
    }
    if (!NEWSLETTER_ENDPOINT) {
      setStatus("error");
      setErrorMsg("Newsletter signup isn't configured yet.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(NEWSLETTER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setStatus("sent");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  if (status === "sent") {
    return (
      <div>
        <h4 className="font-semibold text-sm mb-4">Stay in the loop</h4>
        <p className="text-sm text-muted-foreground">You're subscribed — thanks for reading.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-semibold text-sm mb-4">Stay in the loop</h4>
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Honeypot — hidden from real visitors, bots tend to fill every field */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {status === "sending" ? "…" : "Subscribe"}
          </button>
        </div>
        {status === "error" && <p className="text-xs text-red-600">{errorMsg}</p>}
        <p className="text-xs text-muted-foreground leading-relaxed">
          By subscribing you agree to receive occasional research emails. Unsubscribe anytime. See our{" "}
          <Link href="/legal/privacy" className="hover:text-foreground underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border/50 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <img src="/logo.png" alt="Sunny" className="h-14 w-auto mb-4" loading="lazy" />
            <p className="text-sm text-muted-foreground">
              AI-powered peptide research. Educational content, research-backed guidance.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Compounds</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Research</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-foreground transition-colors">Cookies</Link></li>
              <li><Link href="/legal/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
          <NewsletterSignup />
        </div>
        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Sunny. Educational research content. Not medical advice. For adults 21+.
          </p>
          <p className="text-xs text-muted-foreground">
            Sunny is operated by Brighter Days Labs. Compounds shown are BDL research products.
          </p>
        </div>
      </div>
    </footer>
  );
}
