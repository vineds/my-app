const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { findValidCoupon } = require('./coupons');
const { sendMockEmail } = require('../utils/mailer');

const router = express.Router();
router.use(requireAuth);

const checkoutTxn = db.transaction((userId, cartRows, shipping, payment, coupon) => {
  const subtotal = cartRows.reduce((sum, row) => sum + row.price * row.quantity, 0);
  const discountPercent = coupon ? coupon.discount_percent : 0;
  const discount = +(subtotal * (discountPercent / 100)).toFixed(2);
  const total = +(subtotal - discount).toFixed(2);

  const orderResult = db.prepare(`
    INSERT INTO orders (user_id, subtotal, discount, total, coupon_code, shipping_name,
      shipping_address, shipping_city, shipping_zip, shipping_country, payment_method, payment_last4)
    VALUES (@userId, @subtotal, @discount, @total, @couponCode, @name, @address, @city, @zip, @country, 'card', @last4)
  `).run({
    userId,
    subtotal: +subtotal.toFixed(2),
    discount,
    total,
    couponCode: coupon ? coupon.code : null,
    name: shipping.name,
    address: shipping.address,
    city: shipping.city,
    zip: shipping.zip,
    country: shipping.country || 'US',
    last4: payment.cardNumber ? String(payment.cardNumber).replace(/\s/g, '').slice(-4) : null
  });

  const orderId = orderResult.lastInsertRowid;
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)
  `);
  const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

  for (const row of cartRows) {
    insertItem.run(orderId, row.product_id, row.name, row.price, row.quantity);
    decrementStock.run(row.quantity, row.product_id);
  }

  return { orderId, subtotal, discount, total };
});

// POST /api/checkout
router.post('/checkout', (req, res) => {
  const { shipping, payment, couponCode } = req.body;

  if (!shipping || !shipping.name || !shipping.address || !shipping.city || !shipping.zip) {
    return res.status(400).json({ error: 'shipping.name, address, city, and zip are required' });
  }
  if (!payment || !payment.cardNumber || !payment.expiry || !payment.cvv) {
    return res.status(400).json({ error: 'payment.cardNumber, expiry, and cvv are required (this is a mock, use any values)' });
  }

  const cartRows = db.prepare(`
    SELECT cart_items.product_id, cart_items.quantity, products.name, products.price, products.stock
    FROM cart_items JOIN products ON products.id = cart_items.product_id
    WHERE cart_items.session_id = ?
  `).all(req.sessionId);

  if (cartRows.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  for (const row of cartRows) {
    if (row.quantity > row.stock) {
      return res.status(400).json({ error: `Insufficient stock for ${row.name}` });
    }
  }

  let coupon = null;
  if (couponCode) {
    const result = findValidCoupon(couponCode);
    if (result.error) return res.status(400).json({ error: result.error });
    coupon = result.coupon;
  }

  const { orderId, subtotal, discount, total } = checkoutTxn(req.user.id, cartRows, shipping, payment, coupon);
  db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(req.sessionId);

  sendMockEmail({
    to: req.user.email,
    subject: `Order confirmation #${orderId}`,
    body: `Thanks for your order, ${req.user.name}! Your total was $${total.toFixed(2)}.`,
    meta: { orderId }
  });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  res.status(201).json({ message: 'Order placed successfully', order: { ...order, items } });
});

// GET /api/orders
router.get('/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(orders);
});

// GET /api/orders/:id
router.get('/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

module.exports = router;
