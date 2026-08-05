// No dependency for this — a small heuristic is plenty for steering people
// away from an 8-character weak password, not a security control on its
// own (argon2id + the 8-char minimum do the actual work server-side).
function scorePassword(password: string): number {
  if (password.length < 8) return 0;
  let score = 1; // meets the minimum
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const BAR_COLORS = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];

// `dark` swaps the track/label colors for use on a --noche glass card (the
// auth pages) — AccountPage stays on the default light-theme colors.
export default function PasswordStrengthMeter({ password, dark = false }: { password: string; dark?: boolean }) {
  if (!password) return null;
  const score = scorePassword(password);

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${i < score ? BAR_COLORS[score] : dark ? "bg-background/14" : "bg-secondary"}`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1 ${dark ? "text-background/50" : "text-muted-foreground"}`}>{LABELS[score]}</p>
    </div>
  );
}
