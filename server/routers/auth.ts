import { publicProcedure, router } from "../trpc.ts";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.adminSession || ctx.adminSession.role === "member") return null;
    const { userId, email, role } = ctx.adminSession;
    return { id: userId, email, role };
  }),
});
