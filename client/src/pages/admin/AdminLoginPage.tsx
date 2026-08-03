import { AlertCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Redirect } from "wouter";
import { getSlotUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useMemberAuth } from "@/hooks/useMemberAuth";

export default function AdminLoginPage() {
  const { user, isLoading, login } = useAdminAuth();
  // A signed-in member has nothing to do on the staff login form — this is
  // the same "member session → home, not /admin/anything" rule AdminGuarded
  // applies to the rest of the panel.
  const { user: memberUser, isLoading: memberLoading } = useMemberAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Redirect to="/admin/requests" />;
  }
  if (!memberLoading && memberUser) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't log in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <img src={getSlotUrl("logo")} alt="Sunny" className="h-10 w-auto" />
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-2xl p-8 space-y-5 shadow-sm">
          <div className="text-center mb-2">
            <h1 className="text-xl font-bold text-foreground">Sign in to the panel</h1>
            <p className="text-sm text-muted-foreground mt-1">Sunny team only.</p>
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
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
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
        </form>
      </div>
    </div>
  );
}
