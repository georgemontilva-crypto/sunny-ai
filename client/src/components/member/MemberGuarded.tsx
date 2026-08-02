import type { ReactNode } from "react";
import { Redirect } from "wouter";
import { useMemberAuth } from "@/hooks/useMemberAuth";

export default function MemberGuarded({ children }: { children: ReactNode }) {
  const { user, isLoading } = useMemberAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/signin" />;
  }

  return <>{children}</>;
}
