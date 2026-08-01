import type { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "./AdminLayout";

export default function AdminGuarded({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando el panel…</p>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/admin/login" />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
