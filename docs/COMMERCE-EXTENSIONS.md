# FLIQ commerce extensions

Production remains https://fliq-commerce.vercel.app in the existing `rowdies1/fliq-commerce` project, deployed from `Prashanth2409/22R91A05K0` / `main`.

## Owner controls

- Catalog → Categories / Collections: set a main category, optional parent, and numeric display order. A category can have one subcategory level. Hide a parent to hide its children. Existing product membership and “Order pieces” operations remain available.
- Catalog → Products: edit display order, variants, stock, SKU, up to 12 images, tags and flexible attributes. The CSV / Google Sheets preview and import operations remain available for the owner's roughly 60 products. Import drafts, review images/variants, then publish. Archive demo products when the real products are ready.
- Marketing → Homepage: check Latest Drops, set their order, and save. Only selected visible/published products appear. Enter an owner-hosted HTTPS URL ending in `.mp4` for the muted background video. A blank URL, playback failure or reduced-motion preference keeps the hero image.
- Marketing → Promo codes: create, edit, deactivate or delete codes. Fixed amounts, caps and minimum cart values use INR. Percentage discounts round down to whole paise. Scopes cover orders, products or categories (including child categories). Dates use the operator's local time and are stored in UTC. Per-customer limits are per normalized checkout email; guest checkout does not provide a stronger identity guarantee.
- Customers → Reviews: approve or reject submitted reviews. Buyers submit from their private tracking page after delivery, once per purchased product per order. Photos accept JPEG, PNG or WebP up to 2 MB. Public responses contain no order/customer identifiers. No reviews are preseeded.
- Shipping: process a paid order in Orders, then create its mock shipment. Advance Packed → Ready → Pickup → In Transit → OFD → Delivered. NDR can return to In Transit/OFD or proceed to RTO. NDR/RTO require a note. AWBs and couriers are explicitly mock; no courier request or pickup is booked.

The grouped sidebar retains Orders, product/collection editing, inventory, imports, customers/issues, WhatsApp, analytics, audit, settings, staff, payment recovery, shipping details, exceptional refund/dispute handling and existing search. Standard store policy remains prepaid only, no COD, no returns and no exchanges.

## Storage and payment integrity

New records use the existing locked `fliq_state` transaction and indexed product/order projections. Optional JSON fields (`promotions`, `reviews`, `reviewUploads`, `settings.home`, category `parentId`, product `position`, order `shipment`) are initialized when used. No table replacement, destructive schema migration or order/inventory backfill is required.

Promo eligibility and reservations are computed from server catalog prices in the same transaction as stock reservation. Checkout snapshots contain subtotal, shipping, discount, final amount and promo limits. The captured INR amount must equal that snapshot before an order is finalized. Late captures that lost stock or promo capacity are recorded for owner refund review; stock is not deducted.

Every cart purchase has a new browser purchase identifier and checkout request ID. Only an in-progress request can reuse its provider order for safe retries. Successful checkout IDs are rejected for new creation; signature/order/amount verification and duplicate callback protection remain. Recovery references are tied to the purchase and cleared after completion. Uncertain creation is held for reconciliation instead of silently replacing an unknown provider order.

## Provider configuration

`SHIPPING_PROVIDER=MOCK_SHIPROCKET` is the default. `server/shipping.mjs` defines `create(order)` and `advance(shipment,status,note)`. To add real Shiprocket, implement this interface, register the adapter, add credential variables only in the server environment allowlist, and select `SHIPROCKET`. Unknown provider names fail closed. Existing mock shipments must continue using their original provider. Real credentials alone do not enable an unimplemented carrier integration.

`SENTRY_DSN` is optional and server-only. Events are sent using the Sentry envelope protocol, with an allowlist containing a generic message, area and HTTP status. Customer data, raw exceptions, URLs, headers, tokens, request bodies and breadcrumbs are excluded. API, payment, admin, shipping and frontend failures are covered. Missing/malformed DSNs and delivery failures do not fail commerce requests. No DSN is shipped in the frontend. Production Sentry delivery needs an owner-supplied DSN.

The existing Razorpay TEST configuration is retained. This change does not activate live charges.

## Validation

Run `npm ci`, `npm test`, `npm run build`, `npm run check:functions`, `npm run check:secrets`. Tests cover payment replay, three consecutive purchases, duplicate callbacks, inventory locking, promo scope/dates/caps/limits, review authorization/moderation, hierarchy, shipping transitions and optional telemetry. PostgreSQL execution is exercised with PGlite.

For isolated browser payments, run `node scripts/qa-server.mjs` and open `http://127.0.0.1:4174`. This explicit QA server uses a provider fixture and a fixture checkout dialog; it never uses Razorpay credentials or production data. It is not imported by any production entry point. The normal `npm run test:server` remains on port 4173.

Browser verification covered desktop 1440px and mobile 390px: continuous catalog, no collection pagination, category navigation, product View Cart enablement, admin groups and promo saving. Three sequential browser fixture purchases opened distinct provider order IDs, emptied the cart and cleared recovery. The first used a validated 10% promo; exactly three stock units were deducted. Actual Razorpay TEST settlement is a separate external check.

References: [Razorpay payment verification](https://github.com/razorpay/razorpay-go/blob/master/documents/paymentVerification.md), [Sentry envelopes](https://develop.sentry.dev/sdk/envelopes/).
