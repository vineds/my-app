// Resets the database to a known, deterministic state. Safe to run any time:
// `npm run seed` (from server/) or `npm run reset-db` (from repo root), and
// also exposed live at POST /api/dev/reset for test-suite setup/teardown.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./index');

function seed() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, email_verified)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertUser.run('Demo User', 'demo@techmart.com', bcrypt.hashSync('demo123', 8), 'customer', 1);
  insertUser.run('Store Admin', 'admin@techmart.com', bcrypt.hashSync('admin123', 8), 'admin', 1);
  insertUser.run('Unverified User', 'unverified@techmart.com', bcrypt.hashSync('demo123', 8), 'customer', 0);

  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, category, image, stock, low_stock_threshold)
    VALUES (@name, @description, @price, @category, @image, @stock, @low_stock_threshold)
  `);

  const products = [
    { name: 'Wireless Headphones', description: 'Over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.', price: 79.99, category: 'electronics', image: 'headphones.svg', stock: 15, low_stock_threshold: 5 },
    { name: 'Mechanical Keyboard', description: 'Hot-swappable mechanical keyboard with tactile brown switches and RGB backlighting.', price: 129.99, category: 'electronics', image: 'keyboard.svg', stock: 8, low_stock_threshold: 5 },
    { name: 'USB-C Hub', description: '7-in-1 USB-C hub with HDMI, SD card reader, and 100W passthrough charging.', price: 49.99, category: 'accessories', image: 'hub.svg', stock: 25, low_stock_threshold: 5 },
    { name: 'Monitor Stand', description: 'Adjustable aluminum monitor stand with cable management channel.', price: 89.99, category: 'furniture', image: 'stand.svg', stock: 12, low_stock_threshold: 5 },
    { name: 'Webcam HD', description: '1080p webcam with autofocus and built-in dual microphones.', price: 69.99, category: 'electronics', image: 'webcam.svg', stock: 20, low_stock_threshold: 5 },
    { name: 'Mouse Pad XL', description: 'Extended desk mat, stitched edges, water-resistant surface.', price: 24.99, category: 'accessories', image: 'mousepad.svg', stock: 50, low_stock_threshold: 10 },
    { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse with adjustable DPI and silent clicks.', price: 34.99, category: 'electronics', image: 'mouse.svg', stock: 3, low_stock_threshold: 5 },
    { name: 'Standing Desk Converter', description: 'Sit-stand desk converter with gas-spring height adjustment.', price: 219.99, category: 'furniture', image: 'desk.svg', stock: 4, low_stock_threshold: 5 },
    { name: 'Ergonomic Office Chair', description: 'Mesh-back office chair with lumbar support and adjustable armrests.', price: 249.99, category: 'furniture', image: 'chair.svg', stock: 6, low_stock_threshold: 3 },
    { name: 'Smart Watch', description: 'Fitness tracking smartwatch with heart-rate monitor and 7-day battery.', price: 149.99, category: 'wearables', image: 'watch.svg', stock: 10, low_stock_threshold: 5 },
    { name: 'Bluetooth Earbuds', description: 'True wireless earbuds with charging case and touch controls.', price: 59.99, category: 'wearables', image: 'earbuds.svg', stock: 0, low_stock_threshold: 5 },
    { name: 'Laptop Backpack', description: 'Water-resistant backpack with padded 15-inch laptop compartment.', price: 44.99, category: 'accessories', image: 'backpack.svg', stock: 18, low_stock_threshold: 5 },
    { name: 'Portable SSD 1TB', description: 'USB 3.2 external SSD, up to 1050MB/s read speed.', price: 109.99, category: 'electronics', image: 'ssd.svg', stock: 2, low_stock_threshold: 5 },
    { name: 'Desk Lamp LED', description: 'Dimmable LED desk lamp with USB charging port and 3 color modes.', price: 32.99, category: 'furniture', image: 'lamp.svg', stock: 22, low_stock_threshold: 5 }
  ];
  const productIds = products.map(p => insertProduct.run(p).lastInsertRowid);

  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)
  `);
  insertReview.run(productIds[0], 1, 5, 'Great sound quality and the noise cancellation actually works.');
  insertReview.run(productIds[0], 3, 4, 'Comfortable for long sessions, battery life is as advertised.');
  insertReview.run(productIds[1], 1, 5, 'Satisfying switches, love the sound.');
  insertReview.run(productIds[9], 3, 3, 'Good but the app could use work.');

  const recalcRating = db.prepare(`
    UPDATE products SET
      rating_avg = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE product_id = products.id), 0),
      rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = products.id)
    WHERE id = ?
  `);
  productIds.forEach(id => recalcRating.run(id));

  const insertCoupon = db.prepare(`
    INSERT INTO coupons (code, discount_percent, active, expires_at) VALUES (?, ?, ?, ?)
  `);
  insertCoupon.run('SAVE10', 10, 1, null);
  insertCoupon.run('WELCOME20', 20, 1, null);
  insertCoupon.run('INACTIVE15', 15, 0, null);
  insertCoupon.run('EXPIRED5', 5, 1, '2020-01-01T00:00:00.000Z');

  console.log(`Seeded database at ${db.name}`);
  console.log(`  Users: 3, Products: ${products.length}, Coupons: 4`);
}

module.exports = { seed };

if (require.main === module) {
  seed();
}
