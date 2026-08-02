// This project has never shipped a service worker (no vite-plugin-pwa, no
// manual registration — checked). Browsers that visited whatever was
// previously hosted at this origin can still have one installed, though: a
// SW persists per-origin independent of what the current page ships, and
// once installed it intercepts every future navigation, serving its own
// cached HTML/assets instead of hitting the network at all — which is why
// production could look like an old, pre-redesign build even though the
// server was always answering correctly. Unregister anything installed and
// drop its caches so it stops shadowing real responses.
export function unregisterStaleServiceWorkers(): void {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
  if ("caches" in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        caches.delete(key);
      }
    });
  }
}
