import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient, trpc, trpcClient } from "@/lib/trpc";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import { useSeoMeta } from "./hooks/useSeoMeta";
import ChatWidgetRouteGate from "./components/ChatWidgetRouteGate";
import ConsentGate from "./components/ConsentGate";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import SchemaMarkup from "./components/landing/SchemaMarkup";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
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
// Public routes, lazy for the same reason as the panel below but with one
// extra requirement: these ARE prerendered, so the static HTML must still
// contain the finished page. client/src/entry-server.tsx uses React 19's
// prerenderToNodeStream, which resolves every Suspense boundary before it
// completes — so the build output is identical to what a static import
// produced, while the home page's bundle no longer carries the blog's
// markdown renderer, the partner page, the contact form and four legal
// documents that a visitor to "/" never renders.
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const BlogPostPage = lazy(() => import("@/pages/BlogPostPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const PartnerPage = lazy(() => import("@/pages/PartnerPage"));
const Terms = lazy(() => import("@/pages/legal/Terms"));
const Privacy = lazy(() => import("@/pages/legal/Privacy"));
const Cookies = lazy(() => import("@/pages/legal/Cookies"));
const Disclaimer = lazy(() => import("@/pages/legal/Disclaimer"));

const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminRequestsPage = lazy(() => import("@/pages/admin/AdminRequestsPage"));
const AdminMediaPage = lazy(() => import("@/pages/admin/AdminMediaPage"));
const AdminBlogPage = lazy(() => import("@/pages/admin/AdminBlogPage"));
const AdminBlogEditorPage = lazy(() => import("@/pages/admin/AdminBlogEditorPage"));
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
      <SchemaMarkup />
      <ChatWidgetRouteGate />
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
          {/* Public on purpose, unlike /account below. The chat itself is
          served by Lynx, not by us, and the same assistant is already one
          click away from every public page via the floating bubble — a
          guard here would only add friction to the full-screen version of
          something that is already open. Still noindex (see lib/seo.ts):
          not secret, just not ours to have indexed. */}
          <Route path={"/chat"} component={ChatPage} />
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
          <Route path={"/admin/blog"}>
            <AdminGuarded>
              <AdminBlogPage />
            </AdminGuarded>
          </Route>
          {/* Before the :id route below — otherwise "new" is read as a post id. */}
          <Route path={"/admin/blog/new"}>
            <AdminGuarded>
              <AdminBlogEditorPage />
            </AdminGuarded>
          </Route>
          <Route path={"/admin/blog/:id"}>
            <AdminGuarded>
              <AdminBlogEditorPage />
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
