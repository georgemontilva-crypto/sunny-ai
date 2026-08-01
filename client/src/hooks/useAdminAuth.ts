import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

// login/logout hit REST endpoints (not tRPC procedures) because they need
// to set/clear the session cookie directly — see server/authRoutes.ts.
export function useAdminAuth() {
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery();

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "No se pudo iniciar sesión. Probá de nuevo en un momento.");
      }
      await utils.auth.me.invalidate();
    },
    [utils]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await utils.auth.me.invalidate();
  }, [utils]);

  return {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    login,
    logout,
  };
}
