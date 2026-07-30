import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function MockInbox() {
  const [emails, setEmails] = useState(null);
  const [filter, setFilter] = useState('');

  const load = () => {
    const query = filter ? `?to=${encodeURIComponent(filter)}` : '';
    api.get(`/dev/mock-emails${query}`).then(setEmails);
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <div data-testid="mock-inbox-page">
      <div className="section-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Dev Inbox</h1>
        <button className="btn btn-secondary btn-sm" onClick={load} data-testid="refresh-inbox-button">Refresh</button>
      </div>
      <p style={{ color: 'var(--color-text-muted)' }}>
        This app never sends real email. Every "email" (verification links, password resets, order
        confirmations) is written here instead &mdash; also available at <code>GET /api/dev/mock-emails</code> for
        API test automation.
      </p>

      <div className="form-row" style={{ maxWidth: 320, marginBottom: 16 }}>
        <label htmlFor="inbox-filter">Filter by recipient</label>
        <input id="inbox-filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="user@example.com" data-testid="inbox-filter-input" />
      </div>

      {!emails ? (
        <div className="page-loading">Loading...</div>
      ) : emails.length === 0 ? (
        <div className="empty-state" data-testid="inbox-empty">No emails yet.</div>
      ) : (
        <div data-testid="inbox-list">
          {emails.map((email) => (
            <div key={email.id} className="mock-email" data-testid="inbox-email">
              <div className="mock-email-meta">To: {email.to_email} &middot; {new Date(email.created_at).toLocaleString()}</div>
              <strong data-testid="inbox-email-subject">{email.subject}</strong>
              <p data-testid="inbox-email-body">{email.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
