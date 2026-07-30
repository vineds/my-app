import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AdminTabs from '../../components/AdminTabs';

const STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const { showToast } = useToast();

  const load = (status = statusFilter) => {
    const query = status !== 'all' ? `?status=${status}` : '';
    api.get(`/admin/orders${query}`).then(setOrders);
  };

  useEffect(() => { load(); }, []);

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    load(status);
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      showToast('Order status updated', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div data-testid="admin-orders-page">
      <h1 className="page-title">Admin</h1>
      <AdminTabs />

      <div className="toolbar">
        <div className="form-row">
          <label htmlFor="order-status-filter">Filter by status</label>
          <select id="order-status-filter" value={statusFilter} onChange={(e) => handleFilterChange(e.target.value)} data-testid="admin-order-status-filter">
            <option value="all">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {!orders ? (
        <div className="page-loading">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="empty-state" data-testid="admin-orders-empty">No orders found.</div>
      ) : (
        <table className="data-table" data-testid="admin-orders-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} data-testid="admin-order-row" data-order-id={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer_name}<br /><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{order.customer_email}</span></td>
                <td>${order.total.toFixed(2)}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    data-testid="admin-order-status-select"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
