import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useSeoMeta } from "./hooks/useSeoMeta";
import ConsentGate from "./components/ConsentGate";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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
      <Route path={"/"} component={Home} />
      <Route path={"/blog"} component={BlogPage} />
      <Route path={"/blog/:slug"} component={BlogPostPage} />
      <Route path={"/contact"} component={ContactPage} />
      <Route path={"/legal/terms"} component={Terms} />
      <Route path={"/legal/privacy"} component={Privacy} />
      <Route path={"/legal/cookies"} component={Cookies} />
      <Route path={"/legal/disclaimer"} component={Disclaimer} />
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
    </ErrorBoundary>
  );
}

export default App;
