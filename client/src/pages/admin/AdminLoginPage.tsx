import { AlertCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Redirect } from "wouter";
import AuthBackdrop from "@/components/AuthBackdrop";
import { getSlotUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useMemberAuth } from "@/hooks/useMemberAuth";

const FIELD_LABEL = "text-xs font-medium text-background/50 uppercase tracking-wide font-mono";
const FIELD_INPUT =
  "bg-background/5 border-background/14 text-background placeholder:text-background/50 rounded-lg focus-visible:ring-ring/18";

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
    <div className="min-h-screen flex items-center justify-center bg-noche px-4 relative overflow-hidden">
      <AuthBackdrop />
      <div className="w-full max-w-sm relative z-10">
        <div className="flex justify-center mb-6">
          <img src={getSlotUrl("logo")} alt="Sunny" className="h-10 w-auto" />
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-background/5 backdrop-blur-[16px] backdrop-saturate-150 border border-background/13 rounded-[22px] p-8 space-y-5 shadow-[0_34px_74px_-44px_rgba(0,0,0,0.7)]"
        >
          <div className="text-center mb-2">
            <h1 className="text-xl font-bold text-background">Sign in to the panel</h1>
            <p className="text-sm text-background/60 mt-1">Sunny team only.</p>
          </div>

          <div className="space-y-1.5">
            <label className={FIELD_LABEL}>Email</label>
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD_INPUT}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className={FIELD_LABEL}>Password</label>
            <PasswordInput
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={FIELD_INPUT}
              required
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full font-semibold rounded-lg px-6 hero-cta-glow">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
