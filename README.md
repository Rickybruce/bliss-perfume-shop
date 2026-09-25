# Bliss Perfume Shop

An e-commerce site for a perfume business based at the University of Cape
Coast (UCC), Ghana. Customers are mainly university students. Built by
Rick for his sister, who will run it as the shop owner/admin.

**If you're an AI coding assistant (Antigravity, Cursor, Copilot, etc.)
picking this project up: read this whole file before writing any code.**
It explains decisions that aren't obvious from the code alone, and the
conventions below are not optional — matching them keeps the codebase
consistent across everyone working on it.

## What this is

A full-stack shop: Express + MySQL backend, plain HTML/CSS/JS frontend
(no framework — keep it that way unless discussed). Dark, minimal design.
No glassmorphism, no heavy animation on core pages.

## Who buys, and how they get their order

Customers are university students. There is no courier API — the shop
owner fulfills orders herself, three ways:

- **`junction`** — she sends the order via a public transport driver to
  a junction; the customer collects it there.
- **`house_delivery`** — from the junction, it's carried on to the
  customer's house instead.
- **`ucc_pickup`** — the customer collects in person at her location on
  UCC campus.

This is the `fulfillment_type` enum on the `orders` table. There is
deliberately no shipping-carrier integration — don't add one.

## Tech stack

- **Backend:** Node.js, Express, MySQL (via `mysql2/promise`)
- **Auth:** JWT in an httpOnly cookie, bcrypt password hashing
- **Validation:** zod, server-side, on every route that takes input
- **Payments:** Paystack (not yet integrated — see "What's left")
- **SMS (OTP):** provider not yet chosen — see "What's left"
- **Frontend:** plain HTML/CSS/JS in `public/`, no build step, no framework
- **Images:** Cloudinary or S3 planned — never store images or binary
  data in MySQL, only URLs

## Status: what already exists

| Area | Status |
|---|---|
| Database schema (`db/schema.sql`) | Done — all 9 tables |
| Auth backend (register, verify phone, login, logout, `/me`) | Done, tested |
| Sign-up page | Done, wired to the real API |
| Login page | Done, wired to the real API |
| Phone verification page | Done, wired to the real API |
| Perfume intro animation (login/sign-up) | In progress — see `public/css/intro.css`, `public/js/intro.js`. Currently an SVG box-unboxing animation; the goal is to replace it with a short cinematic video reveal (like a 3D product-reveal ad) that blurs into the login form. Video asset not yet produced. |
| Home / shop page (catalog, filters) | **Not started** |
| Product detail page | **Not started** |
| Cart | **Not started** |
| Checkout (fulfillment choice + payment) | **Not started** |
| Admin (product CRUD, order management, pickup codes) | **Not started** |
| Paystack integration | **Not started** |
| Real SMS provider for OTP | **Not started** — codes currently print to the server console only |

## Project layout

```
db/
  schema.sql              All tables. Run this once against an empty database.
src/
  app.js                  Express app: middleware, routes, static files
  config/
    db.js                 MySQL connection pool
    env.js                Fails fast at startup if a required .env value is missing
  controllers/             One file per resource (auth.controller.js exists; add product/order/etc. controllers the same way)
  services/                Business logic that isn't just a DB query (otp.service.js exists)
  repositories/            All raw SQL lives here, and only here — controllers never write SQL directly
  middleware/              auth, validation, rate limiting, centralized error handling
  validators/              zod schemas, one per resource
  routes/                  Express routers, mounted in app.js under /api/<resource>
  utils/                   Small stateless helpers (phone.js, tokens.js, app-error.js)
public/
  *.html, css/, js/        Plain frontend, no build step
  admin/                   Reserved for the admin UI — not built yet
```

## Conventions — follow these exactly

1. **Money is an integer number of pesewas, never a float.** 1 cedi =
   100 pesewas. Column names end in `_pesewas` (e.g. `price_pesewas`,
   `total_pesewas`). Never store or calculate money as a decimal/float —
   rounding errors compound in a shopping cart.
2. **Price and stock live on `product_variants`, not `products`.** A
   50ml and a 100ml bottle of the same perfume have different prices
   and different stock. Always join through the variant.
3. **All SQL is parameterized.** Use `?` placeholders via `mysql2`,
   never string-concatenate a value into a query. All SQL lives in
   `src/repositories/`, not in controllers or services.
4. **Never trust a price, total, or stock count sent from the client.**
   Recalculate everything server-side from the database at checkout
   time. This is the single most important rule in the codebase — an
   e-commerce site that trusts client-sent prices is broken.
5. **Auth pattern:** JWT signed with `JWT_SECRET`, stored in an httpOnly
   cookie named `session` (see `src/utils/tokens.js`). Protect a route
   with `requireAuth` from `src/middleware/auth.middleware.js`. For
   admin-only routes, check `req.user.role === 'admin'` (add an
   `requireAdmin` middleware alongside it rather than repeating that
   check inline everywhere).
6. **Error handling:** throw `new AppError(statusCode, message)` (see
   `src/utils/app-error.js`) for any expected error — the centralized
   handler in `src/middleware/error-handler.middleware.js` turns it
   into a clean JSON response. Don't `res.status().json()` errors
   directly inside controllers; let the error handler do it, so every
   endpoint fails the same way.
7. **Validation:** every route that accepts a body gets a zod schema in
   `src/validators/` and runs it through the `validate()` middleware.
   See `src/validators/auth.validator.js` for the pattern.
8. **Rate limiting** on anything a bot could abuse (login, OTP, and —
   once built — checkout). See `src/middleware/rate-limit.middleware.js`.
9. **Design system:** dark background only, no glassmorphism, no glass
   panels, minimal. CSS variables are defined in `public/css/auth.css`
   (`--bg`, `--field`, `--border`, `--text`, `--muted`, `--error`,
   `--radius`) — reuse them in any new stylesheet rather than
   redefining colors. System fonts only (no webfont loading) to keep
   pages fast on mobile data.
10. **Mobile-first.** Most customers are on phones on Ghanaian mobile
    data. Keep pages light, images compressed and lazy-loaded, and test
    at a 375–390px viewport width first.
11. **File naming:** `kebab-case.js`, middleware files end in
    `.middleware.js`, validators in `.validator.js` — match the
    existing pattern exactly so files sort predictably.

## What's left to build (see "Status" table)

If you're building the **home/shop page or product detail page**:
- Products need `is_published = 1` to show.
- Fetch product + variants + images from a new `product.repository.js`,
  following the same pattern as `user.repository.js`.
- Filters: scent family, concentration, price range (all on `products`/
  `product_variants`).
- No product endpoints exist yet — you'll need
  `GET /api/products` and `GET /api/products/:id`, following the
  routes → controller → repository pattern already established for auth.

If you're building **cart/checkout**: cart can be client-side only
(localStorage) until checkout; checkout must recalculate everything
server-side (see rule 4 above) and create rows in `orders` and
`order_items`. Fulfillment type selection (`junction` / `house_delivery`
/ `ucc_pickup`) happens at checkout.

If you're building the **admin pages**: gate everything behind
`requireAuth` + an admin role check. Needed: product create/edit form
(with image upload — Cloudinary, not local disk), a stock/price table,
an orders list with status updates, and a pickup-code entry screen for
UCC campus pickup.

## Running it locally

```bash
npm install
mysql -u perfume_app -p perfume_shop < db/schema.sql
npm run dev
```

Copy `.env.example` to `.env` and fill in real values first. See that
file for every variable the app expects.

When you register a test account, the OTP code isn't texted anywhere
yet — it's printed to the server console as
`[OTP] would text +233...: your code is 123456`.

## Payments and SMS (not yet integrated)

Paystack and a real SMS provider are the two integrations still
missing. Don't wire these up speculatively — ask Rick which provider
and which environment (test vs. live keys) before writing the
integration, since it involves real money and real SMS credit costs.