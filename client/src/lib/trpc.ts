import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
// Type-only — never bundled into the client, just gives the panel end-to-end
// type safety against the server's router shape.
import type { AppRouter } from "@server/routers/_app.ts";

export const trpc = createTRPCReact<AppRouter>();

export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const queryClient = new QueryClient();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      // Same-origin already sends the session cookie by default, but this
      // keeps it explicit rather than relying on the fetch default.
      fetch: (input, init) => fetch(input, { ...init, credentials: "include" }),
    }),
  ],
});
