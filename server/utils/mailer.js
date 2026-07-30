const db = require('../db');

const insertEmail = db.prepare(`
  INSERT INTO mock_emails (to_email, subject, body, meta) VALUES (?, ?, ?, ?)
`);

// No real email is ever sent by this app. Every "send" lands in the
// mock_emails table so both the UI (Dev Inbox page) and API tests
// (GET /api/dev/mock-emails) can retrieve verification/reset links.
function sendMockEmail({ to, subject, body, meta }) {
  insertEmail.run(to, subject, body, meta ? JSON.stringify(meta) : null);
  console.log(`[mock-email] to=${to} subject="${subject}"`);
}

module.exports = { sendMockEmail };
