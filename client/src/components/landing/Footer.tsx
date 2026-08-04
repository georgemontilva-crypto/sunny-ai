import { useState } from "react";
import { Link } from "wouter";
import { getSlotUrl } from "@/lib/media";

const NEWSLETTER_ENDPOINT = import.meta.env.VITE_NEWSLETTER_ENDPOINT as string | undefined;

type Status = "idle" | "sending" | "sent" | "error";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const COLUMN_TITLE = "font-mono text-[10.5px] uppercase tracking-wide text-background/42 mb-4";
const FOOTER_LINK = "text-[14.5px] text-background/66 hover:text-accent transition-colors";

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
        <h4 className={COLUMN_TITLE}>Stay in the loop</h4>
        <p className="text-sm text-background/66">You're subscribed — thanks for reading.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className={COLUMN_TITLE}>Stay in the loop</h4>
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
        <div className="flex gap-2 p-1.5 rounded-full bg-background/6">
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-0 px-4 py-2 bg-transparent text-sm text-background placeholder-background/45 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-full text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {status === "sending" ? "…" : "Subscribe"}
          </button>
        </div>
        {status === "error" && <p className="text-xs text-red-400">{errorMsg}</p>}
        <p className="text-xs text-background/50 leading-relaxed">
          By subscribing you agree to receive occasional research emails. Unsubscribe anytime. See our{" "}
          <Link href="/legal/privacy" className="text-background/70 hover:text-accent underline">
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
    <footer className="bg-noche relative overflow-hidden pt-[70px] pb-[34px] px-4">
      <div
        className="warm-glow"
        style={{ width: 800, height: 800, bottom: -260, right: -220 }}
        aria-hidden="true"
      />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr] max-[900px]:grid-cols-2 max-[560px]:grid-cols-1 gap-8 mb-8">
          <div>
            <img src={getSlotUrl("logo")} alt="Sunny" className="h-14 w-auto mb-4" loading="lazy" />
            <p className="text-[14.5px] text-background/66 max-w-[30ch]">
              AI-powered peptide research. Educational content, research-backed guidance.
            </p>
          </div>
          <div>
            <h4 className={COLUMN_TITLE}>Product</h4>
            <ul className="space-y-2.5">
              <li><a href="/#how-it-works" className={FOOTER_LINK}>How it works</a></li>
              <li><a href="/#compounds" className={FOOTER_LINK}>Compounds</a></li>
              <li><a href="/#goals" className={FOOTER_LINK}>Topics</a></li>
              <li><Link href="/partner" className={FOOTER_LINK}>For brands</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={COLUMN_TITLE}>Legal</h4>
            <ul className="space-y-2.5">
              <li><Link href="/legal/privacy" className={FOOTER_LINK}>Privacy</Link></li>
              <li><Link href="/legal/terms" className={FOOTER_LINK}>Terms</Link></li>
              <li><Link href="/legal/cookies" className={FOOTER_LINK}>Cookies</Link></li>
              <li><Link href="/legal/disclaimer" className={FOOTER_LINK}>Disclaimer</Link></li>
            </ul>
          </div>
          <NewsletterSignup />
        </div>
        <div className="border-t border-background/12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/55">
            © 2026 Sunny. Educational research content. Not medical advice. For adults 21+.
          </p>
          <p className="text-xs text-background/55">
            Sunny is operated by Brighter Days Labs. Compounds shown are BDL research products.
          </p>
        </div>
      </div>
    </footer>
  );
}
