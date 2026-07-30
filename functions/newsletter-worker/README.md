# Sunny newsletter signup — Cloudflare Worker

Receives the POST from the footer's newsletter form (`VITE_NEWSLETTER_ENDPOINT`)
and adds the address to a Resend Audience. Not part of the main Vite build —
deployed separately, same pattern as `functions/contact-worker/`.

## Deploy

```bash
cd functions/newsletter-worker
npm install
npx wrangler login
```

1. In the Resend dashboard, create an Audience (Audiences tab) and copy its ID.
2. Set the secrets:
   ```bash
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put RESEND_AUDIENCE_ID
   ```
3. Deploy:
   ```bash
   npx wrangler deploy
   ```

Wrangler prints the Worker's URL — set that as `VITE_NEWSLETTER_ENDPOINT` in
the main site's environment (Railway service variables) and redeploy the site.

## Before going live

- `src/index.ts`'s `ALLOWED_ORIGINS` only lists the Railway domain. Add the
  final production domain once confirmed — keep it in sync with
  `functions/contact-worker/src/index.ts` and `shared/site.ts`'s `SITE.domain`.
