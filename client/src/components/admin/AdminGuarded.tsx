import type { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useMemberAuth } from "@/hooks/useMemberAuth";
import AdminLayout from "./AdminLayout";

export default function AdminGuarded({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAdminAuth();
  // A member session existing at all means this browser is a signed-in
  // visitor, not staff — /admin must never be reachable from there, and
  // /admin/login (which would just reject their credentials anyway) isn't
  // the right place to send them either.
  const { user: memberUser, isLoading: memberLoading } = useMemberAuth();

  if (isLoading || memberLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading the panel…</p>
      </div>
    );
  }

  if (!user) {
    return <Redirect to={memberUser ? "/" : "/admin/login"} />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
