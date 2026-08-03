import { AlertCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useMemberAuth } from "@/hooks/useMemberAuth";
import { getSlotUrl } from "@/lib/media";
import { SITE } from "@shared/site.ts";

export default function SignInPage() {
  const { user, isLoading, login } = useMemberAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Redirect to="/chat" />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <img src={getSlotUrl("logo")} alt="Sunny" className="h-10 w-auto" />
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-2xl p-8 space-y-5 shadow-sm">
          <div className="text-center mb-2">
            <h1 className="text-xl font-bold text-foreground">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border-border/60 focus:border-accent/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
              <a href={`mailto:${SITE.contactEmail}?subject=Forgot%20my%20password`} className="text-xs text-accent hover:underline">
                Forgot password?
              </a>
            </div>
            <PasswordInput
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border-border/60 focus:border-accent/50"
              required
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full font-semibold rounded-lg px-6">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-accent hover:underline font-medium">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
