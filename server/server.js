const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');

const db = require('./db');
const { seed } = require('./db/seed');
const { ensureSession } = require('./middleware/session');

const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const wishlistRouter = require('./routes/wishlist');
const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');
const { router: couponsRouter } = require('./routes/coupons');
const devRouter = require('./routes/dev');
const healthRouter = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Auto-seed on first boot so the app works immediately after `npm install`.
const usersTableEmpty = () => {
  try {
    return db.prepare('SELECT COUNT(*) AS c FROM users').get().c === 0;
  } catch {
    return true; // table doesn't exist yet
  }
};
if (usersTableEmpty()) {
  seed();
}

app.use(cors({ credentials: true, origin: CLIENT_ORIGIN }));
app.use(express.json());
app.use(cookieParser());
app.use(ensureSession);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dev', devRouter);
app.use('/api/health', healthRouter);
app.use('/api', authRouter);
app.use('/api', ordersRouter);

// In production (npm start), the client is built into client/dist and
// served from the same origin/port as the API — one URL to point tests at.
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`TechMart API running on http://localhost:${PORT}`);
});
