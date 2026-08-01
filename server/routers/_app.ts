import { auditRouter } from "./audit.ts";
import { authRouter } from "./auth.ts";
import { mediaRouter } from "./media.ts";
import { requestsRouter } from "./requests.ts";
import { settingsRouter } from "./settings.ts";
import { router } from "../trpc.ts";

export const appRouter = router({
  auth: authRouter,
  requests: requestsRouter,
  media: mediaRouter,
  settings: settingsRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
