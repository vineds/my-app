import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card" data-testid="register-page">
      <h1>Create an account</h1>
      <form className="form" onSubmit={handleSubmit} data-testid="register-form">
        <div className="form-row">
          <label htmlFor="reg-name">Name</label>
          <input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} required data-testid="register-name-input" />
        </div>
        <div className="form-row">
          <label htmlFor="reg-email">Email</label>
          <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="register-email-input" />
        </div>
        <div className="form-row">
          <label htmlFor="reg-password">Password</label>
          <input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} data-testid="register-password-input" />
        </div>
        {error && <div className="form-error" data-testid="register-error">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={submitting} data-testid="register-submit-button">
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <div className="auth-links">
        <Link to="/login">Already have an account? Log in</Link>
      </div>
    </div>
  );
}
