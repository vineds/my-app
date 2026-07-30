import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user.name);
  const [nameError, setNameError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    setNameError('');
    try {
      await api.put('/profile', { name });
      await refreshUser();
      showToast('Profile updated', 'success');
    } catch (err) {
      setNameError(err.message);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarError('');
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      await api.post('/profile/avatar', formData);
      await refreshUser();
      showToast('Avatar updated', 'success');
    } catch (err) {
      setAvatarError(err.message);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await api.put('/password', { currentPassword, newPassword });
      setPasswordSuccess('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  const handleResendVerification = async () => {
    try {
      await api.post('/verify-email/resend');
      showToast('Verification email sent', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div data-testid="profile-page">
      <h1 className="page-title">Your Profile</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="avatar" data-testid="profile-avatar" />
        ) : (
          <div className="avatar-placeholder" data-testid="profile-avatar-placeholder">{user.name.charAt(0).toUpperCase()}</div>
        )}
        <div>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            Change avatar
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} data-testid="avatar-file-input" />
          </label>
          {avatarError && <div className="form-error" data-testid="avatar-error">{avatarError}</div>}
        </div>
      </div>

      <p data-testid="profile-email">Email: {user.email}{' '}
        {user.emailVerified ? (
          <span className="badge badge-success">Verified</span>
        ) : (
          <>
            <span className="badge badge-warning">Unverified</span>{' '}
            <button className="link-button" onClick={handleResendVerification} data-testid="resend-verification-link">Resend verification</button>
          </>
        )}
      </p>
      <p>Role: <span className="badge badge-neutral" data-testid="profile-role">{user.role}</span></p>

      <h3>Edit name</h3>
      <form className="form" onSubmit={handleNameSubmit} data-testid="profile-name-form">
        <div className="form-row">
          <label htmlFor="profile-name">Name</label>
          <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} data-testid="profile-name-input" />
        </div>
        {nameError && <div className="form-error" data-testid="profile-name-error">{nameError}</div>}
        <button type="submit" className="btn btn-primary" data-testid="profile-name-submit-button">Save name</button>
      </form>

      <h3 style={{ marginTop: 32 }}>Change password</h3>
      <form className="form" onSubmit={handlePasswordSubmit} data-testid="profile-password-form">
        <div className="form-row">
          <label htmlFor="profile-current-password">Current password</label>
          <input id="profile-current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} data-testid="profile-current-password-input" />
        </div>
        <div className="form-row">
          <label htmlFor="profile-new-password">New password</label>
          <input id="profile-new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} data-testid="profile-new-password-input" />
        </div>
        {passwordError && <div className="form-error" data-testid="profile-password-error">{passwordError}</div>}
        {passwordSuccess && <div className="form-success" data-testid="profile-password-success">{passwordSuccess}</div>}
        <button type="submit" className="btn btn-primary" data-testid="profile-password-submit-button">Update password</button>
      </form>
    </div>
  );
}
