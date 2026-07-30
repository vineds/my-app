const express = require('express');
const db = require('../db');
const { seed } = require('../db/seed');

const router = express.Router();

// GET /api/dev/mock-emails - the mock inbox. Query by ?to= to filter, e.g.
// pulling a verification or password-reset token in an automated test.
router.get('/mock-emails', (req, res) => {
  const { to } = req.query;
  const rows = to
    ? db.prepare('SELECT * FROM mock_emails WHERE to_email = ? ORDER BY created_at DESC').all(to)
    : db.prepare('SELECT * FROM mock_emails ORDER BY created_at DESC LIMIT 100').all();
  res.json(rows.map(r => ({ ...r, meta: r.meta ? JSON.parse(r.meta) : null })));
});

// POST /api/dev/reset - wipes and reseeds the whole database. Intended for
// use in test setup/teardown so each automated run starts from a clean,
// known state instead of accumulating data across runs.
router.post('/reset', (req, res) => {
  seed();
  res.json({ message: 'Database reset to seed state' });
});

module.exports = router;
