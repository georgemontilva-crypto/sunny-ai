export interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  WORKER_SECRET: string;
}

// Add the production domain here once it's confirmed — see the note in
// shared/site.ts (SITE.domain) in the main repo, this list should match it.
// Also doubles as the base URL for the site's own API (same domain).
const ALLOWED_ORIGINS = [
  "https://sunny-ai-production.up.railway.app",
  // "https://your-final-domain.com",
];
const SITE_API_URL = ALLOWED_ORIGINS[0];

function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

interface ContactPayload {
  name?: string;
  email?: string;
  goal?: string;
  topic?: string; // 'general' | 'standard' | 'whitelabel' | 'partnership' — validated server-side
  message?: string;
  website?: string; // honeypot, passed through untouched
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Mirrors shared/const.ts's CONTACT_TOPICS — duplicated rather than imported
// since this Worker deploys standalone (Cloudflare, not the main build).
const TOPIC_LABELS: Record<string, string> = {
  general: "General question",
  standard: "Sunny Standard",
  whitelabel: "Sunny White-Label",
  partnership: "Partnership",
};

function json(body: unknown, status: number, headers: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

// Registers the message in the site's DB and resolves who it should be
// emailed to (settings.contact_email, with its own fallback baked in
// server-side). Email is the primary channel — if this call fails for any
// reason, we log it and fall back to the Worker's own CONTACT_TO_EMAIL so
// the email still goes out.
async function registerRequest(
  request: Request,
  env: Env,
  payload: { name: string; email: string; goal: string; topic: string; message: string; website?: string }
): Promise<string> {
  try {
    const res = await fetch(`${SITE_API_URL}/api/public/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Secret": env.WORKER_SECRET,
        "X-Forwarded-Client-IP": request.headers.get("CF-Connecting-IP") ?? "",
      },
      body: JSON.stringify({ ...payload, source: "contact" }),
    });

    if (!res.ok) {
      console.error("registerRequest failed:", res.status, await res.text());
      return env.CONTACT_TO_EMAIL;
    }

    const data = (await res.json()) as { contactEmail?: string };
    return data.contactEmail || env.CONTACT_TO_EMAIL;
  } catch (err) {
    console.error("registerRequest error:", err);
    return env.CONTACT_TO_EMAIL;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, headers);
    }
    // Same-origin tools (curl, server-to-server) send no Origin header and are
    // allowed through; browser requests from an unlisted origin are rejected.
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: "Origin not allowed" }, 403, headers);
    }

    let payload: ContactPayload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, headers);
    }

    const name = (payload.name ?? "").trim();
    const email = (payload.email ?? "").trim();
    const goal = (payload.goal ?? "").trim();
    const topic = (payload.topic ?? "").trim();
    const message = (payload.message ?? "").trim();
    const website = (payload.website ?? "").trim();

    if (!name || !email || !message || !isValidEmail(email)) {
      return json({ error: "Missing or invalid required fields" }, 400, headers);
    }

    // Honeypot: a real visitor never fills this (the site's form hides and
    // never even submits it — this only fires for bots that skip the
    // frontend and POST here directly). Look successful, send nothing.
    if (website) {
      return json({ ok: true }, 200, headers);
    }

    const contactTo = await registerRequest(request, env, { name, email, goal, topic, message, website });

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: contactTo,
        reply_to: email,
        subject: `New contact form message from ${name}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          topic ? `About: ${TOPIC_LABELS[topic] ?? topic}` : null,
          goal ? `Research goal: ${goal}` : null,
          "",
          message,
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    });

    if (!resendResponse.ok) {
      console.error("Resend error:", resendResponse.status, await resendResponse.text());
      return json({ error: "Failed to send message" }, 502, headers);
    }

    return json({ ok: true }, 200, headers);
  },
};
