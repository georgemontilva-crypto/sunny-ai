import { hydrateRoot, createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import { unregisterStaleServiceWorkers } from "./lib/unregisterServiceWorker";
import "./index.css";

// Fire-and-forget, doesn't block hydration — unregistering only affects the
// *next* navigation anyway, so there's nothing to wait for here.
unregisterStaleServiceWorkers();

const el = document.getElementById("root")!;
const app = (
  <Router>
    <App />
  </Router>
);

// Prerendered pages ship real markup in #root — hydrate it. Fresh dev-server
// loads (no prerendered content yet) fall back to a normal client render.
if (el.firstChild) {
  hydrateRoot(el, app);
} else {
  createRoot(el).render(app);
}
