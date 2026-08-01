import { eq } from "drizzle-orm";
import { users } from "../schema.ts";
import { publicProcedure, router } from "../trpc.ts";

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session || !ctx.db) return null;

    const [user] = await ctx.db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, ctx.session.userId));

    return user ?? null;
  }),
});
