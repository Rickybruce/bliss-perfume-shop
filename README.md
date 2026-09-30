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
| Auth (register, phone verify, login, logout, `/me`) | Done, tested |
| Sign-up, login, phone verification pages | Done |
| Shop grid with filters (`index.html`), product page | Done |
| Cart (`cart.html`, client-side in localStorage) | Done |
| Checkout, order success, my orders, order detail | Done — server recalculates prices and stock |
| Admin dashboard, products table, product form (create + edit sizes/price/stock/images) | Done |
| Admin orders list, order detail + status updates, campus pickup code screen | Done |
| Delivery & returns, contact, privacy, forgot-password, 404 pages | Done (contact phone number is a placeholder to fill in) |
| Perfume intro animation (login/sign-up) | In progress — SVG version exists; goal is a short cinematic video reveal that blurs into the form |
| Product images | Hosted links (Cloudinary). Local `public/images/` is being retired — see `db/seeds/apply-image-urls.js` |
| Paystack integration | **Not started** — orders are created as `pending`; payment is arranged manually for now |
| Real SMS provider for OTP | **Not started** — codes print to the server console only |
| Cloudinary image *upload* from the admin form | **Not started** — admin pastes an image link instead |
| Email + online password reset | **Not started** — `forgot-password.html` tells users to contact the shop |
| Deployment (`.github/workflows/deploy.yml`, `docs/`) | **Not started** |

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
  admin/                   Admin UI (dashboard, products, orders, pickup). Scripts in admin/js/
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

## What's left to build

- Paystack (test keys first), a real SMS provider, Cloudinary upload, and email for password reset. Ask Rick which provider and which keys before wiring any of them.
- Deployment and `docs/`.
- Do not re-run `db/seeds/products.seed.js` on a live database: it resets stock to the seed numbers. Use the admin pages to change stock and prices.
- Inline `<script>` blocks and inline `on*=` handlers are blocked by the helmet CSP. Put JavaScript in files under `public/js/` or `public/admin/js/`.

## Running it locally

```bash
npm install
mysql -u perfume_app -p perfume_shop < db/schema.sql
node db/seeds/products.seed.js   # optional demo products
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