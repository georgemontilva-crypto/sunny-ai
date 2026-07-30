import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

const STORAGE_KEY = "sunny-consent";
// Bump this if the terms change — anyone who accepted an older version gets
// asked again.
const CONSENT_VERSION = 1;
const TERMS_ID = "consent-terms";

interface StoredConsent {
  accepted: boolean;
  ts: number;
  version: number;
}

function hasValidConsent(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    return parsed.accepted === true && parsed.version === CONSENT_VERSION;
  } catch {
    return false;
  }
}

function saveConsent() {
  try {
    const record: StoredConsent = { accepted: true, ts: Date.now(), version: CONSENT_VERSION };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // localStorage unavailable (private browsing, storage full, etc.) —
    // consent just won't persist and the gate reappears next visit.
  }
}

export default function ConsentGate() {
  // Renders nothing until client JS has taken over, so the prerendered HTML
  // for every route ships with no gate baked in.
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const firstCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || hasValidConsent()) return;
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, [mounted]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!mounted || !visible) return null;

  const canAccept = ageConfirmed && termsConfirmed;

  const handleAccept = () => {
    if (!canAccept) return;
    saveConsent();
    setVisible(false);
  };

  const handleDecline = () => {
    window.close();
    // Still here means the browser blocked the close (this tab wasn't
    // opened by a script). Leave a static message instead of leaving the
    // gate — and the site behind it — sitting open.
    setDeclined(true);
  };

  return (
    <DialogPrimitive.Root open onOpenChange={() => {}}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/60" />
        <DialogPrimitive.Content
          role="dialog"
          aria-modal="true"
          aria-describedby={TERMS_ID}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            firstCheckboxRef.current?.focus();
          }}
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 focus:outline-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
          >
            {declined ? (
              <div className="text-center py-6">
                <DialogPrimitive.Title className="text-lg font-semibold text-foreground mb-2">
                  You can close this tab
                </DialogPrimitive.Title>
                <p className="text-sm text-muted-foreground">
                  You chose not to continue, so there's nothing further to show here. It's safe to close
                  this tab now.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-accent" strokeWidth={1.5} />
                  </div>
                </div>

                <DialogPrimitive.Title className="text-xl font-bold text-foreground text-center mb-2">
                  Before you continue
                </DialogPrimitive.Title>
                <p className="text-sm text-muted-foreground text-center mb-5">
                  Sunny is a research and education platform for adults exploring peptide science.
                </p>

                <div
                  id={TERMS_ID}
                  className="max-h-40 sm:max-h-48 overflow-y-auto rounded-lg border border-border bg-secondary/40 p-4 text-xs text-muted-foreground leading-relaxed space-y-3 mb-5"
                >
                  <p>
                    Everything Sunny publishes — compound summaries, articles, and anything generated
                    through this site — is for educational and research purposes only. Sunny is an AI
                    system, not a physician: it does not diagnose conditions, prescribe treatment, or
                    recommend dosing protocols of any kind.
                  </p>
                  <p>
                    The compounds discussed here are research chemicals. None of them are approved for
                    human consumption, and nothing on this site is an endorsement to use them. Always talk
                    to a licensed healthcare professional before making decisions about your health.
                  </p>
                  <p>
                    By continuing, you accept that Sunny carries no responsibility for choices made based
                    on this content. Full details in our{" "}
                    <Link href="/legal/disclaimer" className="text-accent hover:underline">
                      Disclaimer
                    </Link>{" "}
                    and{" "}
                    <Link href="/legal/terms" className="text-accent hover:underline">
                      Terms of Service
                    </Link>
                    .
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <label className="flex items-start gap-2.5 text-sm text-foreground cursor-pointer">
                    <input
                      ref={firstCheckboxRef}
                      type="checkbox"
                      checked={ageConfirmed}
                      onChange={(e) => setAgeConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 accent-primary"
                    />
                    I confirm that I am at least 21 years old.
                  </label>
                  <label className="flex items-start gap-2.5 text-sm text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsConfirmed}
                      onChange={(e) => setTermsConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 accent-primary"
                    />
                    I understand this is educational information, not medical advice, and I accept the
                    Terms of Service.
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleDecline}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-secondary transition-colors"
                  >
                    Decline &amp; leave
                  </button>
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={!canAccept}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
                  >
                    I agree and enter
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
