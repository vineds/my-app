import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card" data-testid="login-page">
      <h1>Log in</h1>
      <form className="form" onSubmit={handleSubmit} data-testid="login-form">
        <div className="form-row">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="login-email-input" />
        </div>
        <div className="form-row">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="login-password-input" />
        </div>
        {error && <div className="form-error" data-testid="login-error">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={submitting} data-testid="login-submit-button">
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <div className="auth-links">
        <Link to="/forgot-password">Forgot password?</Link>
        <Link to="/register">Create an account</Link>
      </div>
      <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        Demo login: demo@techmart.com / demo123 &middot; Admin: admin@techmart.com / admin123
      </p>
    </div>
  );
}
