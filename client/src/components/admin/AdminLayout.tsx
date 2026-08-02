import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { getSlotUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const NAV_ITEMS = [
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit", label: "Audit log" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAdminAuth();

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 shrink-0 border-r border-border/60 bg-card flex flex-col">
        <div className="px-5 py-5 border-b border-border/60">
          <Link href="/admin/requests" className="flex items-center gap-2">
            <img src={getSlotUrl("logo")} alt="Sunny" className="h-7 w-auto" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Panel</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border/60 space-y-2">
          {user && <p className="px-3 text-sm text-foreground truncate">{user.email}</p>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
