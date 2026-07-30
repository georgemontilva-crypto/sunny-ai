export interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
}

// Add the production domain here once it's confirmed — see the note in
// shared/site.ts (SITE.domain) in the main repo, this list should match it.
const ALLOWED_ORIGINS = [
  "https://sunny-ai-production.up.railway.app",
  // "https://your-final-domain.com",
];

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
  message?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function json(body: unknown, status: number, headers: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
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
    const message = (payload.message ?? "").trim();

    if (!name || !email || !message || !isValidEmail(email)) {
      return json({ error: "Missing or invalid required fields" }, 400, headers);
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: env.CONTACT_TO_EMAIL,
        reply_to: email,
        subject: `New contact form message from ${name}`,
        text: [`Name: ${name}`, `Email: ${email}`, goal ? `Research goal: ${goal}` : null, "", message]
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
