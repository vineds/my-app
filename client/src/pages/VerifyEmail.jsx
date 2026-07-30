import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const token = searchParams.get('token');
  const [status, setStatus] = useState(token ? 'verifying' : 'idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.post('/verify-email', { token })
      .then(() => { setStatus('success'); refreshUser(); })
      .catch((err) => { setStatus('error'); setError(err.message); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async () => {
    setError('');
    try {
      await api.post('/verify-email/resend');
      setStatus('resent');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-card" data-testid="verify-email-page">
      <h1>Verify email</h1>
      {status === 'verifying' && <p>Verifying...</p>}
      {status === 'success' && <div className="form-success" data-testid="verify-email-success">Your email has been verified!</div>}
      {status === 'error' && <div className="form-error" data-testid="verify-email-error">{error}</div>}
      {status === 'resent' && <div className="form-success" data-testid="verify-email-resent">Verification email sent &mdash; check the Dev Inbox.</div>}
      {status === 'idle' && (
        <div>
          <p>No verification token provided.</p>
          {user && !user.emailVerified && (
            <button className="btn btn-primary" onClick={handleResend} data-testid="resend-verification-button">
              Resend verification email
            </button>
          )}
        </div>
      )}
      <p style={{ marginTop: 16 }}><Link to="/mock-inbox">Open Dev Inbox</Link></p>
    </div>
  );
}
