# Sunny contact form — Cloudflare Worker

Receives the POST from the site's contact form (`VITE_CONTACT_ENDPOINT`),
registers it on the site via `POST /api/public/request` (best-effort — a
failure there is logged but never blocks the email), then sends it as an
email via Resend to the address that call resolves (`settings.contact_email`,
falling back to `CONTACT_TO_EMAIL` below if the site call fails). Not part of
the main Vite build — deployed separately.

## Deploy

```bash
cd functions/contact-worker
npm install
npx wrangler login
npx wrangler secret put RESEND_API_KEY   # paste your Resend API key when prompted
npx wrangler secret put WORKER_SECRET    # must match WORKER_SECRET on the site (Railway)
npx wrangler deploy
```

Wrangler will print the Worker's URL (something like
`https://sunny-contact-form.<your-subdomain>.workers.dev`). Set that as
`VITE_CONTACT_ENDPOINT` in the main site's environment (Railway service
variables) and redeploy the site.

## Before going live

- `wrangler.toml`'s `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` are placeholders
  (`hola@sunnypeptides.com`) — update to the real inbox and a sender address
  on a domain verified in Resend.
- `src/index.ts`'s `ALLOWED_ORIGINS` only lists the Railway domain. Add the
  final production domain to that array once it's confirmed (same domain you
  set in `shared/site.ts`'s `SITE.domain` in the main repo).
