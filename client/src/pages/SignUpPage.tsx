import { AlertCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, Redirect } from "wouter";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useMemberAuth } from "@/hooks/useMemberAuth";
import { getSlotUrl } from "@/lib/media";

export default function SignUpPage() {
  const { user, isLoading, signup } = useMemberAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — real visitors never see or fill this
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Redirect to="/chat" />;
  }

  const canSubmit = name.trim() && email.trim() && password.length >= 8 && ageConfirmed && termsConfirmed;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      await signup({ name: name.trim(), email: email.trim(), password, ageConfirmed, termsConfirmed, website });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your account. Please try again.");
      setSubmitting(false);
      return;
    }
    // Redirect happens on the next render, once useMemberAuth's `user` is
    // populated — stays submitting until then rather than flashing the
    // form again.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <img src={getSlotUrl("logo")} alt="Sunny" className="h-10 w-auto" />
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-2xl p-8 space-y-5 shadow-sm">
          <div className="text-center mb-2">
            <h1 className="text-xl font-bold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Free to join. Talk to Sunny about your research goals.</p>
          </div>

          {/* Honeypot: off-screen, not display:none — some bots skip fields hidden that way */}
          <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
            <label htmlFor="signup-website">Leave this field blank</label>
            <input
              id="signup-website"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</label>
            <Input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border-border/60 focus:border-accent/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border-border/60 focus:border-accent/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
            <PasswordInput
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border-border/60 focus:border-accent/50"
              required
            />
            <PasswordStrengthMeter password={password} />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-2.5 text-sm text-foreground cursor-pointer">
              <input
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
              <span>
                I agree to the{" "}
                <Link href="/legal/terms" className="text-accent hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/legal/privacy" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button type="submit" disabled={!canSubmit || submitting} className="w-full font-semibold rounded-lg px-6">
            {submitting ? "Creating your account…" : "Create account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/signin" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
