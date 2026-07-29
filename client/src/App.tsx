import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useSeoMeta } from "./hooks/useSeoMeta";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import ContactPage from "@/pages/ContactPage";
import Terms from "@/pages/legal/Terms";
import Privacy from "@/pages/legal/Privacy";
import Cookies from "@/pages/legal/Cookies";
import Disclaimer from "@/pages/legal/Disclaimer";

function Router() {
  useSeoMeta();
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/legal/terms" component={Terms} />
      <Route path="/legal/privacy" component={Privacy} />
      <Route path="/legal/cookies" component={Cookies} />
      <Route path="/legal/disclaimer" component={Disclaimer} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
