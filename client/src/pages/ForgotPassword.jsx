import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card" data-testid="forgot-password-page">
      <h1>Forgot password</h1>
      {sent ? (
        <div data-testid="forgot-password-sent">
          <p>If that email is registered, a reset link has been sent.</p>
          <p>Check the <Link to="/mock-inbox">Dev Inbox</Link> to grab the reset link (no real email is sent).</p>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} data-testid="forgot-password-form">
          <div className="form-row">
            <label htmlFor="fp-email">Email</label>
            <input id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="forgot-password-email-input" />
          </div>
          {error && <div className="form-error" data-testid="forgot-password-error">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={submitting} data-testid="forgot-password-submit-button">
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </div>
  );
}
