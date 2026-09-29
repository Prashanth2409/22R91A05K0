# Verification record — 2026-09-29

## Source reconciliation

Remote main inspected at `39f9408e4c4b6795c5bf19ba893a73d47c87cc56`; rechecked before publication. The remote encoded bundle is not a reproducible build (invalid Base64 length and an unused replacement chunk). The latest local `FLIQ-FINAL-DRAFT-NETLIFY-v5.zip` supplied the newer storefront/OS implementation; its working design and assets were retained. All 25 original CSS/image assets compare byte-for-byte unchanged. Backend integration replaces the browser-only business state. Existing archive parts were not deleted.

Netlify published deploy inspected: `6aba74d61cdaa7cd55974c4b`, manual Drop deployment, no branch or Git commit reference. Therefore the repository and published site cannot be assumed identical. The signed-in site now explicitly reports production deployments paused due to operational-credit limits. No production deployment of these changes is claimed.

## Automated checks

- Dependency install completed; final dependency audit: zero vulnerabilities. Removed the CSV dependency after its audit advisory and implemented a bounded, tested parser.
- `npm run build`: syntax/public-boundary checks pass; nine routes and function entry points validated.
- `npm test`: 34 tests pass, including PostgreSQL migrations/queries/indexes and transactional projections using PGlite's actual PostgreSQL engine.
- Payment tests exercise exact-variant reservation, concurrent oversell prevention, server totals, invalid signatures/amounts, unique IDs, duplicate callback/webhook idempotency, capture recovery, storage rollback, late-capture refund review and pending/authorized handling.
- API tests exercise role restrictions, CSRF, login throttling, dynamic category/color/size, stock validation, archive/restore, collection ordering, fulfillment/tracking/audit, atomic bulk operations, owner corrections, CSV/Sheets validation, consent and graceful WhatsApp absence.
- `npm run check:functions`: five Netlify function entry points bundle with esbuild-wasm, followed by a bundled API runtime smoke test. Native Netlify CLI bundling on this Windows host failed because native esbuild could not traverse a protected ancestor directory; that native CLI path is not reported as passed.
- `npm run check:secrets`: repository pattern scan passes, with only the exact synthetic payment fixture explicitly exempted. No real credentials are committed. This is a pattern scan plus targeted review, not a guarantee against all possible secret formats.
- `git diff --check`: passes.

## Browser and route checks

- Local HTTP routes `/`, `/admin`, `/checkout`, `/track`, `/collections`, `/product`, `/about`, `/contact`, `/policies` return 200.
- Owner login works. Actual Admin UI creation of a custom Dusty Mauve / Free Size product was verified on storefront → product → cart → checkout.
- Mobile Admin at 390 × 844 renders without horizontal page overflow; responsive controls and phone-sized product/stock editing are present.
- Genuine Razorpay TEST order creation and real checkout.js popup were verified using the supplied TEST key pair through the local QA backend. No fake checkout modal exists. A real domestic TEST-card transaction succeeded: server capture verification created one PAID order and the branded confirmation; exact Dusty Mauve / Free Size stock changed 4 → 3, White / 30 remained 2. The same order appeared automatically in Admin. Drag-and-drop to Processing, then Packed and courier/tracking save were exercised in the UI. The earlier rejected test-card attempt created no paid order or stock change. The authenticated Orders API then advanced the same order through Dispatched → Out for Delivery → Delivered; customer tracking was opened in the browser and displayed Delivered, the courier/tracking ID, and all seven timestamped history events.
- This local UI test uses the explicitly isolated adapter; it does not prove a shared production database is provisioned.

## External checks still pending

PostgreSQL provisioning and migration on the intended shared service; Razorpay signed webhook setup; real Netlify function deployment after deploy credits are restored; full deployed payment/confirmation/Admin/tracking acceptance; real WhatsApp business delivery; private Sheets OAuth if required; high-concurrency/load qualification.

Netlify UI confirms names `RAZORPAY_KEY_ID`, protected `RAZORPAY_KEY_SECRET`, `FLIQ_DEMO_ACCESS`, `SITE_URL`. The older `SECRETKEYID` was left intact. The connector's environment listing was stale/inconsistent with saves, so UI verification was used. No billing/security-access changes were made.

Official TEST-card reference: https://github.com/razorpay/markdown-docs/blob/master/payments/payments/test-card-details.md . Do not use real cards or live credentials for this checklist.
