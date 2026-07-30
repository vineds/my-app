const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

const ORDER_STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

// GET /api/admin/orders
router.get('/orders', (req, res) => {
  const { status } = req.query;
  let rows;
  if (status && status !== 'all') {
    rows = db.prepare(`
      SELECT orders.*, users.name AS customer_name, users.email AS customer_email
      FROM orders JOIN users ON users.id = orders.user_id
      WHERE orders.status = ?
      ORDER BY orders.created_at DESC
    `).all(status);
  } else {
    rows = db.prepare(`
      SELECT orders.*, users.name AS customer_name, users.email AS customer_email
      FROM orders JOIN users ON users.id = orders.user_id
      ORDER BY orders.created_at DESC
    `).all();
  }
  res.json(rows);
});

// GET /api/admin/orders/:id
router.get('/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT orders.*, users.name AS customer_name, users.email AS customer_email
    FROM orders JOIN users ON users.id = orders.user_id
    WHERE orders.id = ?
  `).get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${ORDER_STATUSES.join(', ')}` });
  }
  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
  res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const rows = db.prepare(`
    SELECT id, name, email, role, avatar_url, email_verified, created_at FROM users ORDER BY created_at DESC
  `).all();
  res.json(rows);
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!['customer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be customer or admin' });
  }
  const result = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json(db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.params.id));
});

// GET /api/admin/inventory/alerts
router.get('/inventory/alerts', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM products WHERE stock <= low_stock_threshold ORDER BY stock ASC
  `).all();
  res.json(rows);
});

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  const totalRevenue = db.prepare(`SELECT COALESCE(SUM(total), 0) AS s FROM orders WHERE status != 'cancelled'`).get().s;
  const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const totalProducts = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  const lowStockCount = db.prepare('SELECT COUNT(*) AS c FROM products WHERE stock <= low_stock_threshold').get().c;
  const ordersByStatus = db.prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status').all();
  res.json({ totalOrders, totalRevenue, totalUsers, totalProducts, lowStockCount, ordersByStatus });
});

// GET /api/admin/coupons
router.get('/coupons', (req, res) => {
  res.json(db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all());
});

// POST /api/admin/coupons
router.post('/coupons', (req, res) => {
  const { code, discountPercent, active = true, expiresAt = null } = req.body;
  if (!code || discountPercent === undefined) {
    return res.status(400).json({ error: 'code and discountPercent are required' });
  }
  if (db.prepare('SELECT code FROM coupons WHERE code = ?').get(code.toUpperCase())) {
    return res.status(400).json({ error: 'Coupon code already exists' });
  }
  db.prepare('INSERT INTO coupons (code, discount_percent, active, expires_at) VALUES (?, ?, ?, ?)')
    .run(code.toUpperCase(), parseFloat(discountPercent), active ? 1 : 0, expiresAt);
  res.status(201).json(db.prepare('SELECT * FROM coupons WHERE code = ?').get(code.toUpperCase()));
});

// PUT /api/admin/coupons/:code
router.put('/coupons/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code);
  if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

  const { discountPercent = coupon.discount_percent, active = coupon.active, expiresAt = coupon.expires_at } = req.body;
  db.prepare('UPDATE coupons SET discount_percent = ?, active = ?, expires_at = ? WHERE code = ?')
    .run(parseFloat(discountPercent), active ? 1 : 0, expiresAt, code);
  res.json(db.prepare('SELECT * FROM coupons WHERE code = ?').get(code));
});

// DELETE /api/admin/coupons/:code
router.delete('/coupons/:code', (req, res) => {
  const result = db.prepare('DELETE FROM coupons WHERE code = ?').run(req.params.code.toUpperCase());
  if (result.changes === 0) return res.status(404).json({ error: 'Coupon not found' });
  res.json({ message: 'Coupon deleted' });
});

module.exports = router;
