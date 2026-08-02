import { auditRouter } from "./audit.ts";
import { authRouter } from "./auth.ts";
import { mediaRouter } from "./media.ts";
import { memberRouter } from "./member.ts";
import { requestsRouter } from "./requests.ts";
import { settingsRouter } from "./settings.ts";
import { usersRouter } from "./users.ts";
import { router } from "../trpc.ts";

export const appRouter = router({
  auth: authRouter,
  requests: requestsRouter,
  media: mediaRouter,
  settings: settingsRouter,
  users: usersRouter,
  audit: auditRouter,
  member: memberRouter,
});

export type AppRouter = typeof appRouter;
