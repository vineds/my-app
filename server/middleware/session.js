const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const getSession = db.prepare('SELECT * FROM sessions WHERE id = ?');
const insertSession = db.prepare('INSERT INTO sessions (id) VALUES (?)');
const getUserById = db.prepare(`
  SELECT id, name, email, role, avatar_url, email_verified, created_at FROM users WHERE id = ?
`);

// Every request gets a persistent session row in SQLite (not just an
// in-memory map) so carts survive a server restart and can be inspected
// directly in the DB during test debugging.
function ensureSession(req, res, next) {
  let sessionId = req.cookies.sessionId;
  let session = sessionId ? getSession.get(sessionId) : undefined;

  if (!session) {
    sessionId = uuidv4();
    insertSession.run(sessionId);
    session = getSession.get(sessionId);
    res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'lax' });
  }

  req.sessionId = sessionId;
  req.dbSession = session;
  req.user = session.user_id ? getUserById.get(session.user_id) : null;
  next();
}

module.exports = { ensureSession };
