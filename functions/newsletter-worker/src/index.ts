export interface Env {
  RESEND_API_KEY: string;
  RESEND_AUDIENCE_ID: string;
}

// Keep in sync with functions/contact-worker/src/index.ts and shared/site.ts's
// SITE.domain in the main repo.
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

interface NewsletterPayload {
  email?: string;
  website?: string; // honeypot — never actually used to fill a form field
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
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: "Origin not allowed" }, 403, headers);
    }

    let payload: NewsletterPayload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, headers);
    }

    // Honeypot: a filled "website" field means a bot submitted the form.
    // Report success without actually subscribing anything.
    if (payload.website) {
      return json({ ok: true }, 200, headers);
    }

    const email = (payload.email ?? "").trim();
    if (!isValidEmail(email)) {
      return json({ error: "Missing or invalid email" }, 400, headers);
    }

    // Adds the address to a Resend Audience (Resend's mailing-list contacts
    // API) rather than sending a one-off notification email per signup.
    const resendResponse = await fetch(`https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });

    if (!resendResponse.ok) {
      console.error("Resend error:", resendResponse.status, await resendResponse.text());
      return json({ error: "Failed to subscribe" }, 502, headers);
    }

    return json({ ok: true }, 200, headers);
  },
};
