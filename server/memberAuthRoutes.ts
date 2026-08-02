// Public account creation/login for site visitors — separate from
// server/authRoutes.ts (the panel's admin/editor login) end to end: own
// endpoints, own rate limits, own session realm (server/session.ts). A
// member row can only ever be created here, with role hardcoded to
// 'member' — the panel/seed script are still the only way to create an
// admin or editor.
import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { getDb } from "./db.ts";
import { users } from "./schema.ts";
import { createSession, destroySession } from "./session.ts";

// Same reasoning as authRoutes.ts's DUMMY_HASH: verified on every
// nonexistent-email login attempt so that path takes as long as a real
// password check.
const DUMMY_HASH = await argon2.hash("not-a-real-password-just-for-timing", { type: argon2.argon2id });

const signupSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  // Checkbox state, enforced server-side too — a disabled submit button is
  // not a security control.
  ageConfirmed: z.literal(true),
  termsConfirmed: z.literal(true),
  // Honeypot — real visitors never see or fill this field.
  website: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many accounts created from this address. Try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

export const memberAuthRoutes = Router();

memberAuthRoutes.post("/signup", signupLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please fill in every field correctly." });
    return;
  }

  // Silently accept and do nothing — tipping off the bot would just teach
  // it to stop filling the field. Same pattern as the contact form.
  if (parsed.data.website) {
    res.json({ ok: true });
    return;
  }

  const db = getDb();
  if (!db) {
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  // Hashed unconditionally, before the uniqueness check below, so a
  // taken-email rejection costs the same time as a real signup instead of
  // returning near-instantly and leaking that the email exists.
  const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });

  const id = randomUUID();
  try {
    await db.insert(users).values({
      id,
      email: parsed.data.email,
      passwordHash,
      role: "member",
      name: parsed.data.name,
    });
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "ER_DUP_ENTRY") {
      // Deliberately doesn't say "email already registered" — that
      // confirms the account exists to whoever's asking.
      res.status(400).json({ error: "That email can't be used." });
      return;
    }
    throw err;
  }

  const cookie = await createSession(db, "member", {
    userId: id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  res.setHeader("Set-Cookie", cookie);
  res.json({ id, email: parsed.data.email, name: parsed.data.name });
});

memberAuthRoutes.post("/login", loginLimiter, async (req, res) => {
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

  // An admin/editor's credentials are valid, just not for this realm —
  // rejected here, symmetric to authRoutes.ts rejecting a member's
  // credentials, so nobody gets a session under the wrong cookie.
  if (!user || !valid || !user.isActive || user.role !== "member") {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const cookie = await createSession(db, "member", {
    userId: user.id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  res.setHeader("Set-Cookie", cookie);
  res.json({ id: user.id, email: user.email, name: user.name });
});

memberAuthRoutes.post("/logout", async (req, res) => {
  const db = getDb();
  if (!db) {
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  res.setHeader("Set-Cookie", await destroySession(db, "member", req.headers.cookie));
  res.json({ ok: true });
});
