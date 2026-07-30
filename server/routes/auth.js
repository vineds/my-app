const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { avatarUpload } = require('../middleware/upload');
const { sendMockEmail } = require('../utils/mailer');
const { generateToken } = require('../utils/tokens');

const router = express.Router();

const PUBLIC_FIELDS = 'id, name, email, role, avatar_url, email_verified, created_at';

function publicUser(user) {
  if (!user) return null;
  const { id, name, email, role, avatar_url, email_verified, created_at } = user;
  return { id, name, email, role, avatarUrl: avatar_url, emailVerified: !!email_verified, createdAt: created_at };
}

function issueVerificationEmail(user) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)')
    .run(user.id, token, expiresAt);
  sendMockEmail({
    to: user.email,
    subject: 'Verify your TechMart email',
    body: `Verify your account using this link: /verify-email?token=${token}`,
    meta: { token }
  });
}

// POST /api/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const passwordHash = bcrypt.hashSync(password, 8);
  const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, passwordHash);
  const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(result.lastInsertRowid);

  db.prepare('UPDATE sessions SET user_id = ? WHERE id = ?').run(user.id, req.sessionId);
  issueVerificationEmail(user);

  res.status(201).json({ message: 'Registration successful', user: publicUser(user) });
});

// POST /api/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  db.prepare('UPDATE sessions SET user_id = ? WHERE id = ?').run(user.id, req.sessionId);
  res.json({ message: 'Login successful', user: publicUser(user) });
});

// POST /api/logout
router.post('/logout', (req, res) => {
  db.prepare('UPDATE sessions SET user_id = NULL WHERE id = ?').run(req.sessionId);
  res.json({ message: 'Logged out' });
});

// GET /api/user
router.get('/user', requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});

// PUT /api/profile
router.put('/profile', requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.user.id);
  const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(req.user.id);
  res.json(publicUser(user));
});

// POST /api/profile/avatar
router.post('/profile/avatar', requireAuth, (req, res) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'avatar file is required' });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user.id);
    const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(req.user.id);
    res.json(publicUser(user));
  });
});

// PUT /api/password
router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 8), req.user.id);
  res.json({ message: 'Password updated' });
});

// POST /api/forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // Always return 200 regardless of whether the email exists, to avoid
  // leaking which addresses are registered.
  if (user) {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)')
      .run(user.id, token, expiresAt);
    sendMockEmail({
      to: user.email,
      subject: 'Reset your TechMart password',
      body: `Reset your password using this link: /reset-password?token=${token}`,
      meta: { token }
    });
  }
  res.json({ message: 'If that email is registered, a reset link has been sent' });
});

// POST /api/reset-password
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'token and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const reset = db.prepare('SELECT * FROM password_resets WHERE token = ?').get(token);
  if (!reset || reset.used || new Date(reset.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 8), reset.user_id);
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);
  res.json({ message: 'Password reset successful' });
});

// POST /api/verify-email
router.post('/verify-email', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required' });

  const record = db.prepare('SELECT * FROM email_verifications WHERE token = ?').get(token);
  if (!record || record.used || new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(record.user_id);
  db.prepare('UPDATE email_verifications SET used = 1 WHERE id = ?').run(record.id);
  res.json({ message: 'Email verified' });
});

// POST /api/verify-email/resend
router.post('/verify-email/resend', requireAuth, (req, res) => {
  if (req.user.email_verified) {
    return res.status(400).json({ error: 'Email is already verified' });
  }
  issueVerificationEmail(req.user);
  res.json({ message: 'Verification email sent' });
});

module.exports = router;
