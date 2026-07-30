# TechMart

A full-stack e-commerce sandbox built for practicing test automation — UI (Playwright), API, and
direct database testing — against a realistic-but-small app you run entirely on your own machine.

- **Backend:** Express + SQLite (`better-sqlite3`), session-cookie auth, role-based access
- **Frontend:** React + Vite SPA
- **Database:** a single SQLite file (`data/techmart.sqlite`) you can open directly with any
  SQLite browser, or query from your test setup/teardown

## Quick start

```bash
npm run install:all   # installs server + client dependencies
npm run dev            # runs the API (port 3000) and the Vite dev server (port 5173) together
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` and `/uploads` to the Express
API on port 3000.

The database auto-seeds the first time the server starts. To run everything as a single server
(one origin, closer to how you'd point Playwright at a deployed build):

```bash
npm start   # builds the React app, then serves it + the API from http://localhost:3000
```

### Demo credentials

| Role     | Email                  | Password  |
|----------|-------------------------|-----------|
| Customer | demo@techmart.com       | demo123   |
| Admin    | admin@techmart.com      | admin123  |
| Unverified customer | unverified@techmart.com | demo123 |

## Resetting state

Automated tests want a clean, known starting point. Three ways to get one:

- `npm run reset-db` — wipes and reseeds the SQLite file from the CLI.
- `POST /api/dev/reset` — does the same thing over HTTP, so a Playwright global setup step (or a
  `beforeEach`) can reset the database before a test run without shelling out.
- Delete `data/techmart.sqlite` — the server reseeds automatically on next boot.

## Testing surfaces

**UI:** every interactive element has a `data-testid` attribute (buttons, inputs, table rows,
cards, nav links, toasts, etc.) so Playwright selectors don't need to depend on CSS classes or
text content. Search the JSX under `client/src` for `data-testid` to see the full inventory.

**API:** all endpoints are listed below. Auth is a cookie-based session (`sessionId`), so API
tests need to persist cookies across requests (Playwright's `request` context does this
automatically within a browser context; for a pure API test use `request.newContext()` and reuse
it across calls).

**Database:** `data/techmart.sqlite` is a plain SQLite file — inspect it with `sqlite3`, DB Browser
for SQLite, or a DB extension in your editor. Useful for asserting on state a UI/API test just
created (e.g., "did the order actually decrement stock?"), or for seeding edge-case data directly
before a test.

**Mock email:** the app never sends real email. Registration, password reset, and order
confirmation all write to a `mock_emails` table instead, viewable at `/mock-inbox` in the UI or
via `GET /api/dev/mock-emails` — grab a verification/reset token there without needing a real
inbox.

## Project layout

```
server/            Express API
  db/               SQLite connection, schema.sql, seed.js
  middleware/        session handling, auth guards, avatar upload
  routes/             products, cart, wishlist, orders, auth, admin, coupons, dev, health
client/             React + Vite SPA
  src/pages/          shopper-facing pages
  src/pages/admin/    admin panel pages
  src/context/        Auth, Cart, Toast providers
  src/api/client.js   fetch wrapper (adds credentials + JSON handling)
data/               SQLite database file (gitignored)
uploads/avatars/    uploaded avatar images (gitignored)
```

## API reference

All routes are prefixed with `/api`. Session cookie required where noted.

### Products
- `GET /products` — query: `category`, `search`, `minPrice`, `maxPrice`, `sort` (`price_asc`,
  `price_desc`, `rating`, `newest`, `name`), `page`, `pageSize`. Returns `{ items, total, page,
  pageSize, totalPages }`.
- `GET /products/suggest?q=` — up to 6 name matches, for autocomplete.
- `GET /products/categories` — distinct category list.
- `GET /products/:id`
- `GET /products/:id/reviews`
- `POST /products/:id/reviews` *(auth)* — `{ rating: 1-5, comment }`, one review per user/product.
- `POST /products` *(admin)* — `{ name, price, category, description?, image?, stock?, low_stock_threshold? }`
- `PUT /products/:id` *(admin)*
- `DELETE /products/:id` *(admin)*

### Cart (session-scoped, no login required)
- `GET /cart`
- `POST /cart` — `{ productId, quantity }`
- `PUT /cart/:productId` — `{ quantity }` (quantity `<= 0` removes the item)
- `DELETE /cart/:productId`
- `DELETE /cart` — clears the cart

### Wishlist *(auth required)*
- `GET /wishlist`
- `POST /wishlist` — `{ productId }`
- `DELETE /wishlist/:productId`

### Auth
- `POST /register` — `{ name, email, password }`, logs the user in and sends a mock verification email
- `POST /login` — `{ email, password }`
- `POST /logout`
- `GET /user` *(auth)* — current user
- `PUT /profile` *(auth)* — `{ name }`
- `POST /profile/avatar` *(auth)* — multipart `avatar` file field
- `PUT /password` *(auth)* — `{ currentPassword, newPassword }`
- `POST /forgot-password` — `{ email }`, always 200 (doesn't leak account existence)
- `POST /reset-password` — `{ token, newPassword }`
- `POST /verify-email` — `{ token }`
- `POST /verify-email/resend` *(auth)*

### Checkout & orders *(auth required)*
- `POST /checkout` — `{ shipping: { name, address, city, zip, country? }, payment: { cardNumber, expiry, cvv }, couponCode? }`.
  Payment is a mock — no card is ever charged or stored beyond the last 4 digits.
- `GET /orders` — current user's orders
- `GET /orders/:id`

### Coupons
- `POST /coupons/validate` — `{ code }`. Seeded codes: `SAVE10` (10%), `WELCOME20` (20%),
  `INACTIVE15` (inactive, for negative testing), `EXPIRED5` (expired, for negative testing).

### Admin *(admin role required)*
- `GET /admin/orders` — query: `status`
- `GET /admin/orders/:id`
- `PUT /admin/orders/:id/status` — `{ status }` — `placed | processing | shipped | delivered | cancelled`
- `GET /admin/users`
- `PUT /admin/users/:id/role` — `{ role }` — `customer | admin`
- `GET /admin/inventory/alerts` — products at or below their low-stock threshold
- `GET /admin/stats` — dashboard totals
- `GET /admin/coupons`, `POST /admin/coupons`, `PUT /admin/coupons/:code`, `DELETE /admin/coupons/:code`

### Dev / test utilities
- `GET /dev/mock-emails` — query: `to`. The mock outbox.
- `POST /dev/reset` — wipes and reseeds the database.
- `GET /health` — `{ status, db, timestamp }`

## Notes on design choices for testers

- Checkout requires login (unlike a typical guest-checkout flow) so every order ties to a user for
  order-history testing — a deliberate simplification, not an oversight.
- Stock is decremented at checkout inside a DB transaction; two near-simultaneous checkouts for the
  last unit of a product are a good race-condition test case.
- `low_stock_threshold` is per-product (seeded with a mix of values) so inventory-alert tests have
  both "just crossed the line" and "way understocked" cases.
- Coupons include one inactive and one expired code on purpose, for negative-path testing.
