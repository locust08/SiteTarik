# SiteTarik

SiteTarik is a Next.js app deployed on Cloudflare Workers through OpenNext. The current checkout flow creates Stripe Checkout sessions on the server and keeps the saved order/brief record in Stripe metadata.

## Environment Variables

Public variables (`NEXT_PUBLIC_*`):

- `NEXT_PUBLIC_SITE_URL` - required canonical origin for checkout success and cancel URLs. Use `http://localhost:3000` locally and your production domain in Cloudflare.
- `NEXT_PUBLIC_GTM_ID` - optional GTM container ID.
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` - optional GA4 measurement ID.

Server-only variables:

- `STRIPE_SECRET_KEY` - required Stripe secret key. This must stay server-only.

Not required in the current codebase:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Local Development

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SITE_URL` and `STRIPE_SECRET_KEY`.
3. Add `NEXT_PUBLIC_GTM_ID` and `NEXT_PUBLIC_GA4_MEASUREMENT_ID` only if you want analytics enabled locally.
4. Run:

```bash
npm run dev
```

The checkout readiness check will stay disabled until `NEXT_PUBLIC_SITE_URL` is a valid `http://` or `https://` URL and `STRIPE_SECRET_KEY` starts with `sk_test_` or `sk_live_`.

## Cloudflare Deployment

Keep the existing OpenNext + Cloudflare Workers deployment model.

- Set `NEXT_PUBLIC_SITE_URL` in the Cloudflare Worker environment to the canonical production origin.
- Set `NEXT_PUBLIC_GTM_ID` and `NEXT_PUBLIC_GA4_MEASUREMENT_ID` as plain text Worker variables only if analytics should run in that environment.
- Set `STRIPE_SECRET_KEY` as a Wrangler/Cloudflare secret, not in `wrangler.jsonc`:

```bash
npx wrangler secret put STRIPE_SECRET_KEY
```

- If you use `npm run preview` before deploy, make the same values available to the Wrangler environment used for local Worker preview.
- Deploy with:

```bash
npm run deploy
```

## Notes

- Stripe metadata remains the lightweight saved record for checkout and brief data in this repo.
- GTM/GA4 wiring is optional and stays disabled when the corresponding public env vars are empty.
