const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const SORTS = {
  price_asc: 'price ASC',
  price_desc: 'price DESC',
  rating: 'rating_avg DESC',
  newest: 'created_at DESC',
  name: 'name ASC'
};

// GET /api/products
router.get('/', (req, res) => {
  const { category, search, minPrice, maxPrice, sort } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 12, 1), 100);

  const where = [];
  const params = {};

  if (category && category !== 'all') {
    where.push('category = @category');
    params.category = category;
  }
  if (search) {
    where.push('(LOWER(name) LIKE @search OR LOWER(description) LIKE @search)');
    params.search = `%${search.toLowerCase()}%`;
  }
  if (minPrice !== undefined && minPrice !== '') {
    where.push('price >= @minPrice');
    params.minPrice = parseFloat(minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    where.push('price <= @maxPrice');
    params.maxPrice = parseFloat(maxPrice);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderClause = SORTS[sort] || SORTS.newest;

  const total = db.prepare(`SELECT COUNT(*) AS count FROM products ${whereClause}`).get(params).count;
  const items = db.prepare(`
    SELECT * FROM products ${whereClause}
    ORDER BY ${orderClause}
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: pageSize, offset: (page - 1) * pageSize });

  res.json({ items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) });
});

// GET /api/products/suggest?q=
router.get('/suggest', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) return res.json([]);
  const rows = db.prepare(`
    SELECT id, name, category, price FROM products
    WHERE LOWER(name) LIKE ?
    ORDER BY name ASC LIMIT 6
  `).all(`%${q}%`);
  res.json(rows);
});

router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM products ORDER BY category ASC').all();
  res.json(rows.map(r => r.category));
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// GET /api/products/:id/reviews
router.get('/:id/reviews', (req, res) => {
  const rows = db.prepare(`
    SELECT reviews.id, reviews.rating, reviews.comment, reviews.created_at,
           users.name AS user_name
    FROM reviews JOIN users ON users.id = reviews.user_id
    WHERE product_id = ?
    ORDER BY reviews.created_at DESC
  `).all(req.params.id);
  res.json(rows);
});

function recalcRating(productId) {
  db.prepare(`
    UPDATE products SET
      rating_avg = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE product_id = ?), 0),
      rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
    WHERE id = ?
  `).run(productId, productId, productId);
}

// POST /api/products/:id/reviews
router.post('/:id/reviews', requireAuth, (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { rating, comment = '' } = req.body;
  const ratingNum = parseInt(rating, 10);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  const existing = db.prepare('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?').get(productId, req.user.id);
  if (existing) {
    return res.status(409).json({ error: 'You have already reviewed this product' });
  }

  db.prepare('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)')
    .run(productId, req.user.id, ratingNum, comment);
  recalcRating(productId);

  res.status(201).json({ message: 'Review added' });
});

// POST /api/products (admin)
router.post('/', requireAdmin, (req, res) => {
  const { name, description = '', price, category, image = 'placeholder.svg', stock = 0, low_stock_threshold = 5 } = req.body;
  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: 'name, price, and category are required' });
  }
  if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
    return res.status(400).json({ error: 'price must be a non-negative number' });
  }

  const result = db.prepare(`
    INSERT INTO products (name, description, price, category, image, stock, low_stock_threshold)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, parseFloat(price), category, image, parseInt(stock, 10) || 0, parseInt(low_stock_threshold, 10) || 5);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

// PUT /api/products/:id (admin)
router.put('/:id', requireAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const fields = ['name', 'description', 'price', 'category', 'image', 'stock', 'low_stock_threshold'];
  const updates = {};
  for (const field of fields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.price !== undefined && (isNaN(parseFloat(updates.price)) || parseFloat(updates.price) < 0)) {
    return res.status(400).json({ error: 'price must be a non-negative number' });
  }

  const merged = { ...product, ...updates };
  db.prepare(`
    UPDATE products SET name=?, description=?, price=?, category=?, image=?, stock=?, low_stock_threshold=?
    WHERE id=?
  `).run(merged.name, merged.description, parseFloat(merged.price), merged.category, merged.image,
    parseInt(merged.stock, 10), parseInt(merged.low_stock_threshold, 10), req.params.id);

  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
});

// DELETE /api/products/:id (admin)
router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product deleted' });
});

module.exports = router;
