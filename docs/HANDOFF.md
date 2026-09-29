# FLIQ implementation handoff

Target: https://jazzy-cucurucho-cf43df.netlify.app
Site ID: `27e01034-7e6f-4e8d-88eb-714727e9c3c1`
Repository: `Prashanth2409/22R91A05K0`, branch `main`.

## Environment variables

Set these in Netlify **Environment variables**, including **Functions** scope, for **Production** and any preview context being tested. The current plan does not allow custom scopes; mark credential variables as secrets so they remain protected even where the plan includes Builds/Runtime. Static frontend code does not read environment values. Do not place secrets in `netlify.toml`, `public/`, client bundles or Git. `.env.example` contains names and empty secret placeholders only.

| Variable | Required configuration |
| --- | --- |
| `DATABASE_URL` | Required: pooled PostgreSQL connection URL with provider-required TLS. Run migrations before deployment. |
| `RAZORPAY_KEY_ID` | Required: genuine `rzp_test_…` key. Server sends the public key ID to Checkout only after creating the order. |
| `RAZORPAY_KEY_SECRET` | Required: matching TEST key secret. Server only. |
| `RAZORPAY_WEBHOOK_SECRET` | Required for resilient callback-independent payment completion: same secret configured on Razorpay webhook. |
| `FLIQ_DEMO_ACCESS` | `true` for this protected owner demo: admin/admin, inventory/admin, orders/admin. |
| `SITE_URL` | `https://jazzy-cucurucho-cf43df.netlify.app` |
| `WABA_ACCESS_TOKEN` | Optional until WhatsApp is connected: official Meta Cloud API access token. |
| `WABA_PHONE_NUMBER_ID` | Official WhatsApp Business phone-number ID. |
| `WABA_TEMPLATE_NAME` | Approved order-confirmation template, e.g. `fliq_order_confirmed`. |
| `WABA_STATUS_TEMPLATE_NAME` | Approved fulfillment-update template, e.g. `fliq_order_status`. |
| `WABA_TEMPLATE_LANG` | Approved template language, e.g. `en`. |
| `WABA_GRAPH_VERSION` | Supported Meta Graph version for the business account, default `v23.0`; verify at onboarding. |
| `WABA_APP_SECRET` | Meta app secret for signed webhook verification. |
| `WABA_VERIFY_TOKEN` | Owner-generated WhatsApp webhook verification token. |

Payment keys cannot be edited through a browser settings form. Admin shows configuration presence and TEST mode only. Live keys are intentionally rejected in this prototype.

## Exact deployment steps

1. Obtain the current source repository. From its root run `npm ci`, `npm run build`, `npm test`, `npm run check:functions`, `npm run check:secrets`.
2. Provision PostgreSQL. In a trusted local environment or deployment job set `DATABASE_URL` without printing it, then run `npm run db:migrate`. It creates the schema and seeds demo data only when no store exists; it never resets existing orders. Back up any existing database first.
3. Add the environment variables above in Netlify for this existing site. Preserve its current access controls. Environment changes need a new function deployment.
4. Install/sign in to the official Netlify CLI if not already authenticated: `npx netlify-cli login`. Link the existing site: `npx netlify-cli link --id 27e01034-7e6f-4e8d-88eb-714727e9c3c1`.
5. Create a preview from the repository root: `npx netlify-cli deploy --build --site 27e01034-7e6f-4e8d-88eb-714727e9c3c1`. Verify routes and functions on that preview with the appropriate environment context.
6. Publish the verified source: `npx netlify-cli deploy --build --prod --site 27e01034-7e6f-4e8d-88eb-714727e9c3c1`. This preserves the existing Drop site identity and deploys all functions. Alternatively connect this repository/main in Netlify with base directory empty, build `npm run build`, publish `public`, functions `netlify/functions`. Do not use the obsolete bundle build.
7. Confirm deploy state Ready and these functions: `api`, `razorpay-create-order`, `razorpay-verify-payment`, `razorpay-health`, `message-worker`. Review new build/function logs without copying secrets. Check `/api/health` and `/.netlify/functions/razorpay-health` for configuration presence. GET on a POST checkout endpoint should return 405, not 404.
8. In Razorpay TEST settings use automatic capture and a `payment.captured` webhook at `https://jazzy-cucurucho-cf43df.netlify.app/api/razorpay/webhook`, with the matching webhook secret. Ensure the provider can reach this endpoint under the site's access configuration; do not disable site protection automatically. Browser verification and owner reconciliation remain available if a webhook is temporarily inaccessible.
9. Complete the acceptance checklist below on the actual deployment. A successful build alone is not acceptance.

## Exact end-to-end checklist

- Log in `/admin` as admin/admin. Create a new category, then a legally authorized Draft product with four images, custom color Dusty Mauve, size Free Size and quantity 3. Publish it. Search the storefront and open its product page. Confirm custom options, price and images match.
- Select that color/size, add to cart, open `/checkout`. Enter test customer details and explicitly click Pay. Confirm the **real Razorpay TEST** popup opens. Complete an official TEST transaction. Do not use real money.
- Confirm exactly one FLIQ order ID, PAID status, ordered item/variant, total, customer/address, expected delivery range and exact text: `DROP SECURED.`, `IT’S YOURS.`, `WE’RE GETTING IT STREET-READY.`
- Check Admin: the same order appears and only the exact variant drops from 3 to 2. Reload confirmation. Repeat/replay the signed callback/webhook and confirm no second order or second stock deduction.
- Open private Track Order link. Drag the Admin order to Processing, then Packed. Save courier/service, tracking ID and dispatch date. Move through Dispatched, Out for Delivery, Delivered. Refresh tracking and verify every timestamp/actor in Admin audit. On a phone use the order editor's status selector.
- Cancel only through Owner; ensure the captured payment stays paid with refund review required until an actual provider refund reference is verified. Check customer-facing no-COD/all-sales-final policy remains visible.
- Retry a failed TEST payment, close Checkout, reload while pending, simulate callback network failure, use Check payment and Admin reconciliation. Never create a second charge to recover a captured payment.
- Log in as inventory/admin: create category/product, import and update stock; direct Orders/Settings API requests are forbidden. Log in as orders/admin: orders/customers/tracking work; products/payment/settings/staff APIs are forbidden. Owner sees all.
- Import 10 products using Google Sheets link or CSV. Preview first. Validate description, colors, four images and size totals. New products stay Draft pending legal/stock review. Reimport the same SKU to update rather than duplicate. Invalid prices/negative stock/duplicate rows show errors without partial commit. Multi-color size totals go to the first color; allocate others in the variant editor.
- Search by product, category, order ID, customer and phone. Open results. Exercise page 2, filters, sorting, bulk status updates, archive/restore and collection reorder. Out-of-stock records must remain stored.
- Change supported Store/Shipping/Policy settings and verify storefront reload reflects them. Verify action-center counts and analytics.
- With WhatsApp connected: opt in at checkout, verify order template, queue approved segmented broadcast, inspect delivery logs, opt out through tracking and ensure queued messages are suppressed. Without credentials, checkout must succeed with messaging marked not configured.
- Directly open and refresh `/`, `/admin`, `/checkout`, `/track`, `/collections`, `/product`, `/about`, `/contact`, `/policies`; verify no localhost URL or missing function. Check desktop, tablet and 390px phone viewport.

## WhatsApp onboarding

Use the official Cloud API, verified business/phone, a valid token and approved templates. Confirmation body variables are order ID, Paid, amount in INR, delivery range and private tracking URL (five variables). Status body variables are order ID, fulfillment status, delivery range and tracking URL (four). Broadcast parameters must match the selected approved template.

Configure webhook `/api/whatsapp/webhook` using `WABA_VERIFY_TOKEN` and `WABA_APP_SECRET`; subscribe message statuses. The scheduled worker processes queued messages every five minutes. A timeout produces Unknown rather than an automatic duplicate send; inspect the provider before retrying an uncertain delivery. This implementation did not send messages to real customers.

## External dependencies still needed

Shared PostgreSQL provisioning/migration; Razorpay webhook setup; authenticated CLI or a Git-connected Netlify build; restored Netlify production-deploy credits; actual deployed TEST transaction. WhatsApp requires business onboarding/templates/tokens. Private Google Sheets OAuth is not configured: use a catalogue sheet viewable by link or export CSV. XLSX should be exported to CSV. Live payment/settlement/bank onboarding is deliberately pending owner approval.

## Configuration observed during this continuation

The supplied TEST key pair is configured under `RAZORPAY_KEY_ID` and protected `RAZORPAY_KEY_SECRET`; `FLIQ_DEMO_ACCESS` and `SITE_URL` are also saved and verified by name in the signed-in Netlify UI. The older `SECRETKEYID` entry was preserved and is not used by this code. The connector reported saves that did not appear on read-back, so the missing entries were created through the UI and verified there. No secret values are included in this repository.

Netlify displays: production deploys are paused because the team is running on operational credits. Restoring deploy credits/plan capacity or waiting for the next billing cycle is an owner action. Existing published pages remain live. No billing change was made.
