// Serves ONLY /api/*. In production, static files (the prerendered site and
// the /admin SPA shell) are served by Caddy directly from dist/ — Express
// never touches them. Do NOT add a sendFile("index.html") catch-all here:
// that previously served the SPA shell for every unmatched path, including
// prerendered routes, and silently killed the prerender.
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { authRoutes } from "./authRoutes.ts";
import { appRouter } from "./routers/_app.ts";
import { assertSessionSecret } from "./session.ts";
import { createContext } from "./trpc.ts";

// Fail fast on a missing secret rather than limping along with broken auth.
assertSessionSecret();

const app = express();

// Only trust X-Forwarded-For from the loopback hop (Caddy, same host).
app.set("trust proxy", "loopback");

app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Must match the reverse_proxy target in the Caddyfile.
const PORT = 3001;
app.listen(PORT, "localhost", () => {
  console.log(`[server] listening on :${PORT}`);
});
