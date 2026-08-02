import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

// Mirrors useAdminAuth.ts, against the member realm's own endpoints
// (server/memberAuthRoutes.ts) and its own session cookie — see
// server/session.ts for why these are kept structurally separate from the
// admin panel's login.
export function useMemberAuth() {
  const utils = trpc.useUtils();
  const meQuery = trpc.member.me.useQuery();

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/member-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Couldn't sign in. Please try again in a moment.");
      }
      await utils.member.me.invalidate();
    },
    [utils]
  );

  const signup = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      ageConfirmed: boolean;
      termsConfirmed: boolean;
      website?: string;
    }) => {
      const res = await fetch("/api/member-auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Couldn't create your account. Please try again in a moment.");
      }
      await utils.member.me.invalidate();
    },
    [utils]
  );

  const logout = useCallback(async () => {
    await fetch("/api/member-auth/logout", { method: "POST", credentials: "include" });
    await utils.member.me.invalidate();
  }, [utils]);

  return {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    login,
    signup,
    logout,
  };
}
