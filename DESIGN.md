# Equine Frontend Direction

Reading this as: product-first workwear storefront for Indonesian men, with a calm editorial language and practical utility, dial ENERGY 1 / RHYTHM 2 / MOTION 1.

## Decisions

- Charcoal, bone, moss, and one clay accent reflect fabric, earth, and field use without turning the page into a costume.
- A serif display face paired with a plain sans-serif body gives the brand a considered clothing-store voice while keeping prices and controls easy to scan.
- The homepage starts with a real product selection and category rail because shoppers need to reach pants quickly.
- Product media uses the current Equine store snapshot locally so the catalog remains recognizable and stable while the final asset approval process continues.
- Slightly squared controls and restrained radii keep the interface closer to workwear tools than soft lifestyle cards.
- Motion is limited to hover, drawer, and filter transitions so browsing stays quiet and responsive on mobile.
- The clay accent is reserved for the primary purchase action and selected filter state.

## Storefront Snapshot, 5 September 2026

- Homepage is intentionally minimal after the Hotel Official reference pass: one full-bleed product hero, three visual category doors, a short New in grid, and one compact brand note.
- Keep the reference as rhythm only: large image first, quiet navigation, little copy, visible product categories. Do not copy Hotel Official assets, wording, logo treatment, or brand identity.
- Hero copy stays short and literal: `Celana kerja. Dipakai harian.` Avoid campaign language unless Equine supplies it.
- Category entry points are Cargo, Carpenter, and Loreng, each backed by local product images from `public/product-images`.
- The old homepage service strip and dark manifesto band are intentionally removed from the first screen flow. Restore only if they carry real policy or brand content.

## Admin Panel Direction

- Admin should feel like the same store backend, not a separate SaaS template: charcoal text, bone surfaces, thin dividers, clay only for destructive or save-critical actions.
- Dense tables are allowed. Decorative cards, fake analytics, gradients, glowing badges, and invented performance numbers are not.
- First admin build should cover catalog, stock, orders, and settings with mock data only. No backend, auth, payment provider, or RajaOngkir integration until the frontend shape is approved.
- Empty, loading, save-failed, and invalid-input states are required because admin users can lose data.
- Mobile admin may prioritize readable stacked panels over full table parity. Desktop table behavior comes first.

## Admin Frontend Snapshot, 5 September 2026

- Navigation covers Overview, Produk, Pesanan, Pengaturan, and a direct link back to the storefront.
- Overview prioritizes operational signals: active orders, recorded preview revenue, active products, low stock, order-status distribution, and the latest orders.
- Products supports search, category and publication-state filters, reset filters, stock increment/decrement, active/draft toggles, create/edit modal, and an honest no-results state.
- Orders supports search, status filtering, detail drawer, preview status changes, and an honest no-results state.
- Settings persists only in the browser and retains save-failure feedback. It does not configure a real service.
- Checkout preview orders now feed the admin order list through one frontend mock store. Payment state and fulfillment status are kept separate so a simulated payment update does not erase an admin processing state.
- Product editor supports variant-level color, size, SKU, price, stock, active/draft state, up to six image/video previews, and clear file-size limits. New files remain frontend-only until media storage exists.
- Checkout rechecks product activity, variant identity, and live mock stock before creating a preview order. Prices and SKU snapshots come from the current admin variant.
- A simulated successful payment reduces the selected variant stock once in the frontend mock; repeated payment sync does not deduct stock twice.
- Order fulfillment supports status updates, tracking number, and internal notes. Frontend guard blocks fulfillment before payment and shipping completion without a tracking number.
- Product operations include safe duplication into Draft and draft-only deletion so live catalog items are not removed accidentally in preview.
- Orders can export the active search/filter result to CSV for operational handoff. The file is generated in the browser only.
- Customers consolidates the existing order history into searchable profiles with contact, total spend, saved addresses, and purchase history; no separate customer backend exists yet.
