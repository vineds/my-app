const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/wishlist
router.get('/', (req, res) => {
  const items = db.prepare(`
    SELECT wishlist_items.id AS wishlist_item_id, wishlist_items.created_at, products.*
    FROM wishlist_items JOIN products ON products.id = wishlist_items.product_id
    WHERE wishlist_items.user_id = ?
    ORDER BY wishlist_items.created_at DESC
  `).all(req.user.id);
  res.json(items);
});

// POST /api/wishlist
router.post('/', (req, res) => {
  const { productId } = req.body;
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const existing = db.prepare('SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?')
    .get(req.user.id, productId);
  if (existing) return res.status(409).json({ error: 'Already in wishlist' });

  db.prepare('INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)').run(req.user.id, productId);
  res.status(201).json({ message: 'Added to wishlist' });
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', (req, res) => {
  const result = db.prepare('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?')
    .run(req.user.id, req.params.productId);
  if (result.changes === 0) return res.status(404).json({ error: 'Item not in wishlist' });
  res.json({ message: 'Removed from wishlist' });
});

module.exports = router;
