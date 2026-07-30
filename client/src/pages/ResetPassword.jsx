import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card" data-testid="reset-password-page">
      <h1>Reset password</h1>
      {success ? (
        <div className="form-success" data-testid="reset-password-success">Password reset! Redirecting to login...</div>
      ) : (
        <form className="form" onSubmit={handleSubmit} data-testid="reset-password-form">
          <div className="form-row">
            <label htmlFor="rp-token">Reset token</label>
            <input id="rp-token" value={token} onChange={(e) => setToken(e.target.value)} required data-testid="reset-password-token-input" />
          </div>
          <div className="form-row">
            <label htmlFor="rp-password">New password</label>
            <input id="rp-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} data-testid="reset-password-new-input" />
          </div>
          {error && <div className="form-error" data-testid="reset-password-error">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={submitting} data-testid="reset-password-submit-button">
            {submitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      )}
      <div className="auth-links">
        <Link to="/mock-inbox">Find your token in the Dev Inbox</Link>
      </div>
    </div>
  );
}
