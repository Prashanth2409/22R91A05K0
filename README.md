# FLIQ commerce prototype

The existing FLIQ storefront and OS design, extended with server-side Razorpay TEST checkout, PostgreSQL storage, fulfillment, tracking, staff roles, imports and messaging hooks.

- [Deployment, exact environment variables and acceptance checklist](docs/HANDOFF.md)
- [Architecture, recovery and production limitations](docs/ARCHITECTURE.md)
- [Verification results and source provenance](docs/VERIFICATION.md)
- Authoritative requirements: [master brief](docs/FLIQ_MASTER_IMPLEMENTATION_BRIEF.md) and [master prompt](docs/FLIQ_CODEX_MASTER_PROMPT.txt).

```sh
npm ci
npm run build
npm test
npm run check:functions
npm run check:secrets
```

For isolated local UI QA: `npm run test:server`, then visit http://127.0.0.1:4173. This adapter stores test data under ignored `.local/`, never in the browser business database, and is not deployed. It still requires genuine Razorpay TEST credentials to open Checkout; no fake payment route exists.

For Netlify use the repository root, `npm run build`, publish `public`, functions `netlify/functions`. A static drag-and-drop upload of `public` alone cannot deploy the server functions. Keep the existing site and deploy the whole project with Netlify CLI or connect this repository.

The old `bundle.parts` files remain for source history. The active build no longer decodes the incomplete archive. `legacy/local-demo-api.js` is reference-only and is excluded from the publish directory.
