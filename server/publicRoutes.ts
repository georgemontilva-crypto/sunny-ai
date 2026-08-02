// Public, unauthenticated endpoint the contact-form Worker posts to. Gated
// by a shared secret (not a user session) because the caller is a server,
// not a browser.
import { randomUUID, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { z } from "zod";
import { SITE } from "../shared/site.ts";
import { getDb, type Db } from "./db.ts";
import { requests, settings } from "./schema.ts";

const BUILD_INFO_PATH = path.resolve(import.meta.dirname, ".build-info.json");

const WORKER_SECRET = process.env.WORKER_SECRET;
if (!WORKER_SECRET) {
  throw new Error("WORKER_SECRET is not set");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// settings.contact_email is the operator-editable destination (Fase 6);
// shared/site.ts's SITE.contactEmail is both its seed value and its
// fallback for a fresh install or a DB that isn't answering.
async function resolveContactEmail(db: Db | null): Promise<string> {
  if (!db) return SITE.contactEmail;
  try {
    const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "contact_email"));
    return row?.value || SITE.contactEmail;
  } catch (err) {
    console.error("[public/request] settings lookup failed, using SITE.contactEmail fallback:", err);
    return SITE.contactEmail;
  }
}

const requestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  goal: z.string().trim().max(500).optional(),
  message: z.string().trim().min(1).max(5000),
  source: z.enum(["contact", "partner", "newsletter"]).default("contact"),
  // Honeypot — real visitors never see or fill this field.
  website: z.string().optional(),
});

// Keyed on the visitor IP the Worker forwards (its own outbound IP would
// otherwise be shared by every submission site-wide, making per-IP limiting
// meaningless); falls back to req.ip for direct/manual testing.
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.get("x-forwarded-client-ip") || req.ip;
    return ip ? ipKeyGenerator(ip) : "unknown";
  },
  message: { error: "Too many requests" },
});

export const publicRoutes = Router();

// Answers "is this container actually running today's code?" without
// needing Railway dashboard/log access — curl it after a deploy or a
// republish and compare `commit` against the latest push.
publicRoutes.get("/build-info", (_req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(BUILD_INFO_PATH, "utf-8")));
  } catch {
    res.status(404).json({ error: "No .build-info.json (local dev without a full `pnpm build`?)" });
  }
});

publicRoutes.post("/request", publicLimiter, async (req, res) => {
  const secret = req.get("x-worker-secret") ?? "";
  if (!safeEqual(secret, WORKER_SECRET)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const db = getDb();
  const contactEmail = await resolveContactEmail(db);

  // Pretend success and save nothing — tipping off the bot would just teach
  // it to stop filling the field.
  if (parsed.data.website) {
    res.json({ ok: true, contactEmail });
    return;
  }

  if (!db) {
    res.json({ ok: true, contactEmail });
    return;
  }

  await db.insert(requests).values({
    id: randomUUID(),
    name: parsed.data.name,
    email: parsed.data.email,
    goal: parsed.data.goal,
    message: parsed.data.message,
    source: parsed.data.source,
    ip: req.get("x-forwarded-client-ip") || req.ip,
    userAgent: req.get("user-agent"),
  });

  res.json({ ok: true, contactEmail });
});
