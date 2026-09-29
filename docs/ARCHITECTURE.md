# Storage, trust and recovery

## Data boundary

`server/api.mjs` is shared by Netlify and the explicitly isolated local QA adapter. Netlify requires PostgreSQL and fails closed with 503 if `DATABASE_URL` is absent. It never silently falls back to a browser database. Browser localStorage is only for cart/wishlist preferences; sessionStorage retains a checkout recovery token. The legacy demo interceptor is outside `public/` and is not loaded.

All business mutations enter `store.transaction`. PostgreSQL locks the store aggregate row; order, payment reference, exact color/size stock, status history, audit and message queue commit atomically. Catalogue/order projections update in that same transaction and have indexes for pagination, full-text search, status, dates and provider payment/checkout uniqueness. Catalogue/order list responses are bounded to 100 records, usually 24; imports are limited to 500 per batch. Images are resized client-side before upload and served from shared database storage; lists lazy-load images.

This is a shared, persistent backend adapter, not a claim that a production database is connected. The aggregate write lock intentionally prioritizes transaction correctness for this prototype. Mutations, dashboard, global search and customer summaries still read the aggregate. For high write concurrency/large historical volume, normalize attempts, variants, customers, audits, sessions and the outbox into dedicated tables with row-level transactions and database aggregates; load-test that migration. Indexed product/order browsing is implemented, but full high-scale production qualification is not complete.

## Payment trust

The server looks up product authorization, availability, price, shipping and currency, and reserves exact color/size inventory. The browser supplies choices, never authoritative totals or payment state. A server request ID prevents duplicate order creation for retries. Completion requires HMAC verification plus a Razorpay API payment lookup proving captured status, amount, INR currency and provider order identity. Signed webhooks and authenticated reconciliation reuse the same idempotent finalizer.

Stock changes once in the order transaction. A failure after provider capture rolls back local changes and can be recovered without charging again. Late capture after reservation expiry that cannot be fulfilled is retained as a paid exception requiring owner refund review; it is not silently lost and stock never becomes negative. Provider-create timeout is marked uncertain: do not blindly recreate a payment. Reconcile against Razorpay receipt/attempt metadata with the owner. Refunds require a matching processed provider refund ID; fulfillment cancellation never pretends money was refunded.

Sessions are HTTP-only, SameSite, Secure on HTTPS, expire after eight hours, and require CSRF on changes. Staff permissions are checked on every server route; disabling/changing staff invalidates their sessions. Demo accounts work only when `FLIQ_DEMO_ACCESS=true`. Before public real operations rotate all three accounts from the protected Admin Staff panel, store the generated passwords safely and set the demo flag false. Keep a working Owner account.

Tracking URLs carry an unguessable token in the fragment, sent in a header to the server; order IDs alone do not disclose customer details. Treat these links as private. No payment secret enters public code. The browser receives only the public Razorpay key ID required by Checkout.

## Backup and recovery preparation

- Use managed PostgreSQL automated encrypted daily backups and point-in-time recovery, with retention/region/access controls agreed by the owner. Set measurable RPO/RTO and alerts for failed backups and database capacity.
- Back up all tables together, including `fliq_state`, indexed projections and `fliq_images` (uploaded bytes). Retain schema migrations, deployed Git revision and environment-variable **names**; keep credentials in the provider's secret manager separately.
- Before migrations, capture a database snapshot. `pg_dump`/provider snapshots must be consistent; never copy only catalogue data while omitting payment references/orders/audit.
- Regularly restore into an isolated database, run migrations/checks and compare order counts, unique payment references and stock totals. Prevent restored test systems from sending WhatsApp or receiving production callbacks.
- After incident recovery, reconcile captured payments since the restore point using Razorpay records/webhooks before reopening checkout. Preserve provider payment IDs and idempotency records; replay through the finalizer, not manual stock decrement.
- Roll back application deploys independently of business data. Never reseed/reset store state to fix a frontend problem. Pause checkout during incompatible schema recovery and retain paid exceptions for owner review.
- If images move to object storage later, include object versions and access policies in the backup plan and test URLs after restore.

## Source / deployment boundary

The active source tree is readable `public`, `server`, `database`, `netlify/functions`, `scripts` and `tests`. The old encoded archive is retained but not executed. The inspected Netlify site is a manual Drop deployment with no Git commit reference, so Git updates alone do not prove production changed. Deploy the full project/functions to the existing site and test its resulting URL.
