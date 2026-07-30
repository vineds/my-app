const express = require('express');
const db = require('../db');

const router = express.Router();

function findValidCoupon(code) {
  if (!code) return null;
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code.toUpperCase());
  if (!coupon) return { error: 'Coupon not found' };
  if (!coupon.active) return { error: 'Coupon is not active' };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { error: 'Coupon has expired' };
  }
  return { coupon };
}

// POST /api/coupons/validate
router.post('/validate', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });

  const result = findValidCoupon(code);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ code: result.coupon.code, discountPercent: result.coupon.discount_percent });
});

module.exports = { router, findValidCoupon };
