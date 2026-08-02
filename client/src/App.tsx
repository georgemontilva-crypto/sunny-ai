import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient, trpc, trpcClient } from "@/lib/trpc";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import { useSeoMeta } from "./hooks/useSeoMeta";
import ConsentGate from "./components/ConsentGate";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import ContactPage from "@/pages/ContactPage";
import PartnerPage from "@/pages/PartnerPage";
import Terms from "@/pages/legal/Terms";
import Privacy from "@/pages/legal/Privacy";
import Cookies from "@/pages/legal/Cookies";
import Disclaimer from "@/pages/legal/Disclaimer";
import AdminGuarded from "@/components/admin/AdminGuarded";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminRequestsPage from "@/pages/admin/AdminRequestsPage";
import AdminMediaPage from "@/pages/admin/AdminMediaPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminAuditPage from "@/pages/admin/AdminAuditPage";

function Router() {
  useSeoMeta();
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/blog"} component={BlogPage} />
      <Route path={"/blog/:slug"} component={BlogPostPage} />
      <Route path={"/contact"} component={ContactPage} />
      <Route path={"/partner"} component={PartnerPage} />
      <Route path={"/legal/terms"} component={Terms} />
      <Route path={"/legal/privacy"} component={Privacy} />
      <Route path={"/legal/cookies"} component={Cookies} />
      <Route path={"/legal/disclaimer"} component={Disclaimer} />
      {/* /admin/* is never in scripts/prerender.mjs's routes list or the
          sitemap — see that script's dedicated dist/admin/index.html shell. */}
      <Route path={"/admin/login"} component={AdminLoginPage} />
      <Route path={"/admin/requests"}>
        <AdminGuarded>
          <AdminRequestsPage />
        </AdminGuarded>
      </Route>
      <Route path={"/admin/media"}>
        <AdminGuarded>
          <AdminMediaPage />
        </AdminGuarded>
      </Route>
      <Route path={"/admin/settings"}>
        <AdminGuarded>
          <AdminSettingsPage />
        </AdminGuarded>
      </Route>
      <Route path={"/admin/users"}>
        <AdminGuarded>
          <AdminUsersPage />
        </AdminGuarded>
      </Route>
      <Route path={"/admin/audit"}>
        <AdminGuarded>
          <AdminAuditPage />
        </AdminGuarded>
      </Route>
      <Route path={"/admin"}>
        <Redirect to="/admin/requests" />
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            defaultTheme="light"
            // switchable
          >
            <TooltipProvider>
              <Toaster />
              <ConsentGate />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

export default App;
