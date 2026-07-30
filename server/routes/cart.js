const express = require('express');
const db = require('../db');

const router = express.Router();

function getCartWithProducts(sessionId) {
  const items = db.prepare(`
    SELECT cart_items.id AS cart_item_id, cart_items.quantity, products.*
    FROM cart_items JOIN products ON products.id = cart_items.product_id
    WHERE cart_items.session_id = ?
    ORDER BY cart_items.id ASC
  `).all(sessionId);

  const mapped = items.map(row => ({
    cartItemId: row.cart_item_id,
    quantity: row.quantity,
    product: {
      id: row.id, name: row.name, description: row.description, price: row.price,
      category: row.category, image: row.image, stock: row.stock
    }
  }));
  const total = mapped.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  return { items: mapped, total: total.toFixed(2) };
}

// GET /api/cart
router.get('/', (req, res) => {
  res.json(getCartWithProducts(req.sessionId));
});

// POST /api/cart
router.post('/', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const qty = parseInt(quantity, 10);
  if (!productId || !Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ error: 'productId and a positive integer quantity are required' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const existing = db.prepare('SELECT * FROM cart_items WHERE session_id = ? AND product_id = ?')
    .get(req.sessionId, productId);
  const currentQty = existing ? existing.quantity : 0;

  if (product.stock < currentQty + qty) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(currentQty + qty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)')
      .run(req.sessionId, productId, qty);
  }

  res.json({ message: 'Added to cart', ...getCartWithProducts(req.sessionId) });
});

// PUT /api/cart/:productId
router.put('/:productId', (req, res) => {
  const { quantity } = req.body;
  const qty = parseInt(quantity, 10);
  const productId = parseInt(req.params.productId, 10);

  const existing = db.prepare('SELECT * FROM cart_items WHERE session_id = ? AND product_id = ?')
    .get(req.sessionId, productId);
  if (!existing) return res.status(404).json({ error: 'Item not in cart' });

  if (!Number.isInteger(qty) || qty <= 0) {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(existing.id);
  } else {
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
    if (product.stock < qty) return res.status(400).json({ error: 'Insufficient stock' });
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(qty, existing.id);
  }

  res.json({ message: 'Cart updated', ...getCartWithProducts(req.sessionId) });
});

// DELETE /api/cart/:productId
router.delete('/:productId', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE session_id = ? AND product_id = ?')
    .run(req.sessionId, req.params.productId);
  res.json({ message: 'Removed from cart', ...getCartWithProducts(req.sessionId) });
});

// DELETE /api/cart
router.delete('/', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(req.sessionId);
  res.json({ message: 'Cart cleared', items: [], total: '0.00' });
});

module.exports = router;
