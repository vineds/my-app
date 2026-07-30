const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/health
router.get('/', (req, res) => {
  let dbStatus = 'ok';
  try {
    db.prepare('SELECT 1').get();
  } catch (err) {
    dbStatus = 'error';
  }
  res.json({ status: 'healthy', db: dbStatus, timestamp: new Date().toISOString() });
});

module.exports = router;
