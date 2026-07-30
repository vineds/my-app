import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import AdminTabs from '../../components/AdminTabs';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(setStats);
    api.get('/admin/inventory/alerts').then(setAlerts);
  }, []);

  return (
    <div data-testid="admin-dashboard-page">
      <h1 className="page-title">Admin</h1>
      <AdminTabs />

      {stats && (
        <div className="stat-grid" data-testid="admin-stats">
          <div className="stat-card"><div className="stat-card-value" data-testid="stat-orders">{stats.totalOrders}</div><div className="stat-card-label">Orders</div></div>
          <div className="stat-card"><div className="stat-card-value" data-testid="stat-revenue">${stats.totalRevenue.toFixed(2)}</div><div className="stat-card-label">Revenue</div></div>
          <div className="stat-card"><div className="stat-card-value" data-testid="stat-users">{stats.totalUsers}</div><div className="stat-card-label">Users</div></div>
          <div className="stat-card"><div className="stat-card-value" data-testid="stat-products">{stats.totalProducts}</div><div className="stat-card-label">Products</div></div>
          <div className="stat-card"><div className="stat-card-value" data-testid="stat-low-stock">{stats.lowStockCount}</div><div className="stat-card-label">Low stock</div></div>
        </div>
      )}

      <h3>Inventory alerts</h3>
      {!alerts ? (
        <div className="page-loading" data-testid="inventory-alerts-loading">Loading...</div>
      ) : alerts.length === 0 ? (
        <p className="empty-state" data-testid="no-inventory-alerts">All products are well stocked.</p>
      ) : (
        <table className="data-table" data-testid="inventory-alerts-table">
          <thead><tr><th>Product</th><th>Stock</th><th>Threshold</th><th></th></tr></thead>
          <tbody>
            {alerts.map((product) => (
              <tr key={product.id} data-testid="inventory-alert-row">
                <td>{product.name}</td>
                <td>{product.stock === 0 ? <span className="badge badge-danger">Out of stock</span> : product.stock}</td>
                <td>{product.low_stock_threshold}</td>
                <td><Link to="/admin/products">Manage</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
