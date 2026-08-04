import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient, trpc, trpcClient } from "@/lib/trpc";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import { useSeoMeta } from "./hooks/useSeoMeta";
import ConsentGate from "./components/ConsentGate";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
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
import MemberGuarded from "@/components/member/MemberGuarded";

// Lazy-loaded on purpose, unlike every other route above: scripts/
// prerender.mjs never runs renderToString against any of these paths (it
// writes a generic empty shell for /admin/* and for /signin, /signup,
// /chat, /account instead — see the comments below), so there's no
// prerendering to break. A visitor to "/" downloading the entire admin
// panel and member-auth flow just to render the home page is exactly the
// "unused JavaScript" a mobile Lighthouse run flags — these chunks now
// only load once someone actually navigates to one of these paths.
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminRequestsPage = lazy(() => import("@/pages/admin/AdminRequestsPage"));
const AdminMediaPage = lazy(() => import("@/pages/admin/AdminMediaPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminAuditPage = lazy(() => import("@/pages/admin/AdminAuditPage"));
const SignInPage = lazy(() => import("@/pages/SignInPage"));
const SignUpPage = lazy(() => import("@/pages/SignUpPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

function Router() {
  useSeoMeta();
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
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
          {/* /signin, /signup, /chat, /account are never in scripts/prerender.mjs's
          routes list or the sitemap — server/index.ts serves dist/app-shell.html
          (a generic noindex empty shell, same idea as /admin's) for a direct hit. */}
          <Route path={"/signin"} component={SignInPage} />
          <Route path={"/signup"} component={SignUpPage} />
          <Route path={"/chat"}>
            <MemberGuarded>
              <ChatPage />
            </MemberGuarded>
          </Route>
          <Route path={"/account"}>
            <MemberGuarded>
              <AccountPage />
            </MemberGuarded>
          </Route>
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
      </Suspense>
    </>
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
