import { publicProcedure, router } from "../trpc.ts";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.session) return null;
    const { userId, email, role } = ctx.session;
    return { id: userId, email, role };
  }),
});
