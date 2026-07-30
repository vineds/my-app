import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AdminTabs from '../../components/AdminTabs';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState(null);
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const load = () => api.get('/admin/coupons').then(setCoupons);

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/coupons', { code, discountPercent: parseFloat(discountPercent) });
      setCode('');
      setDiscountPercent('');
      showToast('Coupon created', 'success');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (coupon) => {
    await api.put(`/admin/coupons/${coupon.code}`, { active: !coupon.active });
    load();
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Delete coupon ${code}?`)) return;
    await api.delete(`/admin/coupons/${code}`);
    showToast('Coupon deleted', 'info');
    load();
  };

  return (
    <div data-testid="admin-coupons-page">
      <h1 className="page-title">Admin</h1>
      <AdminTabs />

      <h2>New coupon</h2>
      <form className="form" onSubmit={handleCreate} data-testid="coupon-form">
        <div className="form-grid">
          <div className="form-row">
            <label htmlFor="coupon-code-input">Code</label>
            <input id="coupon-code-input" value={code} onChange={(e) => setCode(e.target.value)} required data-testid="coupon-code-field" />
          </div>
          <div className="form-row">
            <label htmlFor="coupon-discount-input">Discount %</label>
            <input id="coupon-discount-input" type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} required data-testid="coupon-discount-field" />
          </div>
        </div>
        {error && <div className="form-error" data-testid="coupon-form-error">{error}</div>}
        <button type="submit" className="btn btn-primary" data-testid="coupon-create-button">Create coupon</button>
      </form>

      <h2 style={{ marginTop: 32 }}>Existing coupons</h2>
      {!coupons ? (
        <div className="page-loading">Loading...</div>
      ) : (
        <table className="data-table" data-testid="admin-coupons-table">
          <thead><tr><th>Code</th><th>Discount</th><th>Status</th><th>Expires</th><th></th></tr></thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.code} data-testid="admin-coupon-row">
                <td>{coupon.code}</td>
                <td>{coupon.discount_percent}%</td>
                <td>{coupon.active ? <span className="badge badge-success">Active</span> : <span className="badge badge-neutral">Inactive</span>}</td>
                <td>{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : '—'}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleToggleActive(coupon)} data-testid="toggle-coupon-button">
                    {coupon.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(coupon.code)} data-testid="delete-coupon-button">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
