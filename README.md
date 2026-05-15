# SiteTarik

SiteTarik is a Next.js app deployed on Cloudflare Workers through OpenNext. The current checkout flow creates Stripe Checkout sessions on the server and keeps the saved order/brief record in Stripe metadata.

## Environment Variables

Public variables (`NEXT_PUBLIC_*`):

- `NEXT_PUBLIC_SITE_URL` - required canonical origin for checkout success and cancel URLs. Use `http://localhost:3000` locally and your production domain in Cloudflare.
- `NEXT_PUBLIC_GTM_ID` - optional GTM container ID. For SiteTarik, set this to `GTM-5F3MLDMN` anywhere GTM should run.
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` - optional GA4 web measurement ID in `G-XXXXXXXXXX` format only. For SiteTarik, the real measurement ID is `G-2RV95WLNQ2`. Do not use the GA4 property reference `534874257` here.

Server-only variables:

- `STRIPE_SECRET_KEY` - required Stripe secret key. This must stay server-only.

Not required in the current codebase:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Local Development

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SITE_URL` and `STRIPE_SECRET_KEY`.
3. Keep `NEXT_PUBLIC_GTM_ID=GTM-5F3MLDMN` if you want the existing GTM container to run locally.
4. Set `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-2RV95WLNQ2` when you want direct GA4 fallback available locally.
4. Run:

```bash
npm run dev
```

The checkout readiness check will stay disabled until `NEXT_PUBLIC_SITE_URL` is a valid `http://` or `https://` URL and `STRIPE_SECRET_KEY` starts with `sk_test_` or `sk_live_`.

## Cloudflare Deployment

Keep the existing OpenNext + Cloudflare Workers deployment model.

- The production Worker is routed to `https://sitetarik.com/*` and `https://www.sitetarik.com/*` in `wrangler.jsonc`.
- `NEXT_PUBLIC_SITE_URL=https://sitetarik.com`, `NEXT_PUBLIC_GTM_ID=GTM-5F3MLDMN`, and `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-2RV95WLNQ2` are committed as plain text Worker variables in `wrangler.jsonc`.
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
- GTM runs when `NEXT_PUBLIC_GTM_ID` is a valid `GTM-...` container ID. It remains the primary analytics path for SiteTarik pageviews and custom events.
- Direct GA4 runs only when `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is a valid `G-...` measurement ID and GTM is not configured. The fallback uses `gtag('config', ..., { send_page_view: false })` so pageviews and events are not double-counted.
- Manual setup still required in Google Tag Manager or GA4: publish the GTM container, and in Cloudflare/OpenNext use `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-2RV95WLNQ2` anywhere you want the GA4 fallback available.
- The local SiteTarik app now emits the core analytics events `site_tarik_page_view`, `site_tarik_checkout_started`, and `site_tarik_checkout_success`, which map to GA4 `page_view`, `begin_checkout`, and `purchase`.
- SiteTarik also emits `site_tarik_package_selected` and `site_tarik_blog_brief_submitted` as optional supporting events for package intent and SEO Enhancement brief completion.
