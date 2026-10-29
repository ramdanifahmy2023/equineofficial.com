# Equine Official Implementation Plan

Status: planning baseline
Project: websotre-equineofficial
Domain: equineofficial.com
Frontend: Nuxt 3 + Nitro

## Storefront Baseline Locked, 5 September 2026

The storefront direction now uses a minimalist, image-led homepage inspired by the pacing of `https://hotelofficial.co/`, without copying its assets or brand expression.

Locked homepage structure:

1. Full-screen product hero using local Equine product imagery.
2. Three visual category doors: Cargo, Carpenter, Loreng.
3. Four-product New in grid.
4. Compact About Equine note and catalog link.

Current local preview:

- Dev server: `http://127.0.0.1:3020`
- Source entry: `pages/index.vue`
- Homepage CSS: `assets/css/main.css`
- Validation passed: `npm run typecheck`, `NUXT_IGNORE_LOCK=1 npm run build`

Admin frontend baseline is now implemented. Keep backend and live integrations frozen.

## Frontend-First Delivery Order

Backend and live provider integration are intentionally frozen until the frontend is approved. The next milestone is a complete clickable frontend using local mock data and stable API-shaped contracts.

Frontend audit fixes, 5 September 2026:

- Product cards open the product's variant selection; they no longer add the first size automatically.
- Checkout creates an immutable preview-order snapshot in sessionStorage, keyed by a unique order number. Items, contact, shipping, payment method, total, and simulated status survive refresh in the same tab. Closing that tab ends the preview session.
- Payment pages clearly label the simulation. Manual status controls require `preview=1`; status changes never clear the shopping cart or claim provider verification. Unknown order numbers have an explicit empty state.
- Shared native dialogs manage modal focus, Escape, focus return, and scroll locks for the cart, product confirmation, product zoom, and admin overlays.
- Admin settings persist locally in the browser, including honest save-failure feedback. These preview settings do not configure a live provider.
- Product-card wishlist layering and text contrast are corrected. The unsupported newest-sort option is removed until publication-date data exists.
- Size guidance discloses that official measurements are still pending; no measurements are fabricated.
- Regression checks are in `tests/frontend-regression.cjs`. This work adds no backend endpoints, authentication, database, provider integration, or deployment.

Frontend completion order:

1. Storefront visual system and reusable states.
2. Catalog, product detail, cart, and checkout UX.
3. Mock shipping and mock payment result states.
4. Admin UI using mock catalog, stock, order, and content data.
5. Responsive, accessibility, SEO, and interaction QA.
6. Frontend approval and API contract freeze.
7. Backend implementation and provider integration.

Backend must not force a redesign after this milestone. The frontend will consume typed composables or server-shaped mock functions so the later API swap remains limited to the data layer.

Current storefront milestone delivered:

- Checkout mock with destination suggestions, shipping cards, ETD, payment method cards, and total calculation.
- Payment status route with pending, success, failed, and expired preview states.
- Minimal homepage redesign with full-bleed hero, category tiles, short New in grid, and compact brand note.
- Responsive and interaction QA completed for storefront, checkout, and payment routes.

Admin panel frontend baseline delivered. All admin routes remain preview-only until approved.

Admin frontend scope for next milestone:

- Dashboard: order summary, low stock, recent activity, no fabricated revenue claims.
- Catalog: product table, search, category/status filter, stock edit, draft/active state.
- Orders: list, status filter, detail drawer, payment/shipping preview labels.
- Settings: store identity, shipping defaults, payment placeholder, local save-failure feedback.
- Shared states: empty, loading, error, unsaved changes, destructive confirmation.

Admin frontend validation, 5 September 2026:

- `npm run typecheck` passed.
- `NUXT_IGNORE_LOCK=1 npm run build` passed while the local dev preview remained active.
- `tests/frontend-regression.cjs` passed all 13 route, interaction, accessibility, state, and responsive-overflow checks.

Frontend transaction-flow audit update, 5 September 2026:

- Added a single `useAdminStore()` mock data layer for admin products, admin orders, and checkout-preview order sync.
- Checkout-created preview orders now appear in the admin order list and order drawer.
- Payment simulation changes sync into admin as payment status while preserving fulfillment status once staff starts processing.
- Admin order detail now shows item lines, customer contact, address, shipping method, payment status, total, and timeline when the preview order contains those fields.
- Regression now verifies checkout to payment to admin order visibility and admin drawer operational details.
- Product editing now covers variant-level inventory plus image/video browser previews, with local persistence excluding transient data URLs.
- Checkout now revalidates active products, variant identity, and current mock stock before creating an order snapshot.
- Successful preview payments now apply a single idempotent stock deduction to the selected mock variant.
- Admin order fulfillment now records a tracking number and internal note, with frontend guards for unpaid orders and missing tracking numbers.
- Admin product operations now support duplicate-as-draft and draft-only deletion.
- Admin order list now exports the active filtered result as a browser-generated CSV.
- Admin customer profiles now derive from the existing order data and expose contact, spend, address, and order history in the frontend preview.

## 1. Current Position

The current staging frontend is suitable for a product browsing MVP:

- Homepage, catalog, search, filters, sorting, and responsive layouts.
- Product detail with local product images, price hierarchy, color and size selection.
- Add-to-cart modal, cart drawer, quantity controls, and localStorage persistence.
- Draft checkout form and empty-cart guard.
- Static product snapshot sourced from the Equine Shopee storefront.

It is not ready for live transactions yet. Product, inventory, shipping, order, payment, and admin data still need a server-side source of truth.

## 2. Integration Decisions

### Pakasir

Use the hosted payment URL for the first live checkout release:

`https://app.pakasir.com/pay/{slug}/{amount}?order_id={order_id}&redirect={redirect_url}`

This keeps payment UI and payment-method handling on Pakasir while Equine owns the order and payment status. The API-key based native QRIS/VA screen can be added after the order and webhook flow is proven.

Required server responsibilities:

- Create a unique pending order before redirecting to Pakasir.
- Send an integer amount and a unique order ID.
- Store the Pakasir project slug in server environment variables.
- Configure a public HTTPS webhook URL in the Pakasir project dashboard.
- Validate webhook `project`, `order_id`, `amount`, and `status`.
- Confirm the status with Transaction Detail API before marking an order paid.
- Make webhook processing idempotent and return success for duplicate deliveries.
- Use Transaction Cancel API for eligible expired or abandoned payments.

Pakasir API methods to support in the service layer:

- Hosted payment redirect for phase 1.
- `POST /api/transactioncreate/{method}` for native QRIS/VA phase 2.
- `GET /api/transactiondetail` for verification and payment status refresh.
- `POST /api/paymentsimulation` in sandbox tests.
- `POST /api/transactioncancel` for cancellation.

Payment state model:

`pending`, `awaiting_payment`, `paid`, `expired`, `cancelled`, `failed`, `refunded`.

Never mark an order paid from the browser redirect alone. The source of truth is server-side verification plus the webhook/detail response.

### RajaOngkir

Use the Shipping Cost API through a server-side adapter.

Live base URL:

`https://rajaongkir.komerce.id/api/v1/`

Authentication header:

`key: ${RAJAONGKIR_API_KEY}`

Flow:

1. Search the customer destination using `GET destination/domestic-destination?search=...`.
2. Store the selected destination ID, not only the displayed text.
3. Calculate domestic shipping with `POST calculate/domestic-cost`.
4. Send origin ID, destination ID, total weight in grams, courier code, and price sort.
5. Display courier name, service, cost, and ETD as selectable checkout options.
6. Recalculate server-side when the order is created and persist the selected quote.
7. Add `POST track/waybill` after shipment and AWB data are available.

The destination search should be debounced and cached. Static destination or courier data should be cached server-side. API errors must produce a usable checkout message and never expose the API key.

Required business inputs before implementation:

- Equine warehouse origin destination ID.
- Courier codes enabled by the RajaOngkir account.
- Weight in grams for every product variant and packaging rule.
- Optional package dimensions if required by the selected courier.
- Whether the store ships domestic only in the first release.

## 3. Target Architecture

Keep one Nuxt application for the first release:

- Nuxt pages and components for the storefront and admin UI.
- Nitro server routes under `server/api` for all business operations.
- PostgreSQL for products, variants, stock, orders, payments, and webhook logs.
- Drizzle ORM for typed schema and migrations.
- Cloudflare Tunnel from the VPS to the local Nitro process.
- Secrets only in VPS environment variables, never in Vue code or GitHub.

Initial environment variables:

```text
DATABASE_URL=
PAKASIR_PROJECT_SLUG=
PAKASIR_API_KEY=
PAKASIR_WEBHOOK_URL=https://equineofficial.com/api/webhooks/pakasir
RAJAONGKIR_API_KEY=
RAJAONGKIR_ORIGIN_ID=
RAJAONGKIR_COURIERS=jne:jnt:sicepat
PUBLIC_SITE_URL=https://equineofficial.com
```

The exact courier list must be confirmed against the RajaOngkir account before putting it in production.

## 4. Database Scope

### Catalog

- `products`: slug, name, description, category, material, fit, active state.
- `product_variants`: product ID, color, size, SKU, price, compare-at price, weight grams, stock.
- `product_images`: variant/product image URLs, sort order, alt text.
- `inventory_movements`: adjustment, reservation, release, sale, reason, actor.

### Commerce

- `orders`: public order number, customer snapshot, subtotal, shipping cost, total, status.
- `order_items`: product and variant snapshots, SKU, price, quantity, weight.
- `order_shipping`: destination snapshot, courier, service, cost, ETD, quote metadata.
- `payments`: provider, method, amount, fee, payment number, expiry, status, timestamps.
- `webhook_events`: provider event body, received time, processing status, error, unique hash.

Order items must store snapshots so later product or price edits do not change historical orders.

## 5. Internal API Contract

### Catalog and shipping

- `GET /api/products`
- `GET /api/products/:slug`
- `GET /api/shipping/destinations?search=`
- `POST /api/shipping/quotes`

### Checkout and payment

- `POST /api/orders` validates cart, price, variant, and stock, then creates a pending order.
- `POST /api/orders/:orderNumber/payment` creates the Pakasir hosted URL or native payment.
- `GET /api/orders/:orderNumber` returns safe public status data.
- `POST /api/webhooks/pakasir` receives and verifies payment events.
- `POST /api/orders/:orderNumber/cancel` cancels eligible unpaid orders.

### Admin

- `POST /api/admin/auth/login`
- `GET/POST/PATCH /api/admin/products`
- `GET/PATCH /api/admin/orders`
- `POST /api/admin/inventory/adjustments`
- `GET/PATCH /api/admin/settings`

All admin routes require authenticated server-side sessions and role checks.

## 6. Frontend Work Phases

### Phase 0: Data and environment readiness

- Confirm official catalog, SKU, variant, stock, size chart, weight, image, return, and shipping data.
- Create `.env.example` without secrets.
- Decide domestic-only scope and enabled courier codes.
- Confirm Pakasir project slug, sandbox/live mode, fee payer policy, payment methods, and webhook URL.
- Confirm RajaOngkir origin ID and API plan/key.

### Phase 1: Backend foundation

- Add PostgreSQL, Drizzle schema, migrations, seed data, and server-only config.
- Move catalog reads from `data/products.ts` to server APIs.
- Add product and variant validation.
- Add stock reservation and release rules.
- Add order creation with server-side price calculation.

### Phase 2: RajaOngkir checkout

- Replace the current shipping placeholder with destination autocomplete.
- Add address fields for recipient, phone, province/city/district/subdistrict, postal code, and address detail.
- Debounce destination search and show selected location labels.
- Request quotes when destination and cart weight are valid.
- Show courier/service radio cards with cost and ETD.
- Recalculate and persist the selected quote at order creation.
- Add loading, empty, retry, and API-error states.

### Phase 3: Pakasir payment

- Create the pending order before payment.
- Redirect to Pakasir hosted payment URL in phase 1.
- Build payment pending, paid, expired, cancelled, and failed pages.
- Add webhook verification using amount/order ID and Transaction Detail API.
- Add payment status polling only as a UX enhancement, never as the authority.
- Add sandbox payment simulation tests.
- Add native QRIS/VA screen later if the merchant requires an on-site payment experience.

### Phase 4: Admin panel

- Admin login and protected layout.
- Product, variant, price, discount, image, and stock CRUD.
- Order list with payment and fulfillment filters.
- Order detail with customer, shipping quote, payment, and status timeline.
- Inventory adjustment with audit log.
- Settings for origin, courier, return policy, and storefront content.

### Phase 5: Production frontend hardening

- Persist wishlist globally in the browser until the customer account/server contract exists.
- Add product gallery zoom using the approved local product asset; additional gallery images remain data-dependent.
- Add Escape close and body scroll lock for cart, product, and admin overlays.
- Add dynamic product and wishlist page titles/descriptions.
- Add frontend-ready empty, validation, payment-state, shipping-state, and admin preview states.
- Add analytics events for view product, select variant, add cart, begin checkout, and payment result.
- Add clear retry states for catalog, shipping, and payment failures.

#### Frontend-first milestone delivered

- Storefront routes: home, catalog filters/sort/search, product detail, wishlist, cart drawer, checkout, payment state, shipping, returns, and size guide.
- Customer interactions: variant selection, quantity controls, add-to-cart confirmation, buy-now flow, persisted cart, persisted wishlist, product zoom, and responsive mobile navigation.
- Admin preview routes: overview, product create/edit, stock controls, active/draft toggle, order detail/status update, and storefront/shipping settings.
- Verification: Nuxt typecheck, production build, responsive route smoke test at 390px, and CloakBrowser interaction audit.

### Phase 6: Deployment

- Build production Nitro output and run it as a systemd service on localhost.
- Route `equineofficial.com` through Cloudflare Tunnel to the service.
- Keep webhook route uncached and reachable through HTTPS.
- Add Cloudflare rate limiting/WAF rules for public APIs and admin protection.
- Configure database backups, log retention, health endpoint, and uptime monitoring.
- Run sandbox payment and shipping acceptance tests before switching live keys.

## 7. Acceptance Criteria

The first live release is ready only when:

- A customer can select a real variant with available stock.
- Checkout calculates a server-verified subtotal and RajaOngkir quote.
- The final order total is recalculated on the server.
- Pakasir receives a unique order ID and correct integer amount.
- Redirect, webhook, duplicate webhook, detail verification, expiry, and cancellation are tested.
- Paid orders cannot be paid twice or decrement stock twice.
- Admin can update stock and process an order without editing source code.
- API keys are absent from browser bundles, logs, and Git history.
- Cloudflare HTTPS domain and Pakasir webhook are reachable end to end.
- Checkout remains usable when either provider times out or returns an error.

## 8. Immediate Next Step

Do not integrate against guessed values. First collect the merchant inputs in Phase 0, then implement the database and server API foundation. The current frontend checkout should remain a draft until those values are available.

Official references:

- Pakasir docs: https://pakasir.com/p/docs
- RajaOngkir endpoint overview: https://www.rajaongkir.com/docs/shipping-cost/getting_started/endpoint
- RajaOngkir destination search: https://www.rajaongkir.com/docs/shipping-cost/endpoint-rajaongkir-for-search-base/search-destination-rajaongkir
- RajaOngkir domestic cost: https://www.rajaongkir.com/docs/shipping-cost/endpoint-rajaongkir-for-search-base/calculate-domestic-cost
- RajaOngkir authorization: https://www.rajaongkir.com/docs/shipping-cost/getting_started/apikey
