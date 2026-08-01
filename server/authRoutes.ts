import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { getDb } from "./db.ts";
import { users } from "./schema.ts";
import { clearSessionCookie, createSessionCookie } from "./session.ts";

// Argon2id hash of an unguessable fixed string, verified against on every
// "user not found" login attempt so that path takes as long as a real
// password check — otherwise the response-time difference would leak
// whether an email is registered, even though the error message doesn't.
const DUMMY_HASH = await argon2.hash("not-a-real-password-just-for-timing", { type: argon2.argon2id });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

export const authRoutes = Router();

authRoutes.post("/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const db = getDb();
  if (!db) {
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));

  const valid = await argon2
    .verify(user?.passwordHash ?? DUMMY_HASH, parsed.data.password)
    .catch(() => false);

  if (!user || !valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  res.setHeader("Set-Cookie", createSessionCookie({ userId: user.id, role: user.role }));
  res.json({ id: user.id, email: user.email, role: user.role });
});

authRoutes.post("/logout", (_req, res) => {
  res.setHeader("Set-Cookie", clearSessionCookie());
  res.json({ ok: true });
});
