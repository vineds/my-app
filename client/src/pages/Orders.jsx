import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const STATUS_BADGE = {
  placed: 'badge-info',
  processing: 'badge-warning',
  shipped: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-danger'
};

export default function Orders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get('/orders').then(setOrders);
  }, []);

  if (!orders) return <div className="page-loading">Loading...</div>;

  if (orders.length === 0) {
    return (
      <div className="empty-state" data-testid="orders-empty">
        <p>You haven't placed any orders yet.</p>
        <Link to="/" className="btn btn-primary">Browse products</Link>
      </div>
    );
  }

  return (
    <div data-testid="orders-page">
      <h1 className="page-title">Your Orders</h1>
      <table className="data-table" data-testid="orders-table">
        <thead>
          <tr><th>Order</th><th>Date</th><th>Status</th><th>Total</th><th></th></tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} data-testid="order-row" data-order-id={order.id}>
              <td>#{order.id}</td>
              <td>{new Date(order.created_at).toLocaleDateString()}</td>
              <td><span className={`badge ${STATUS_BADGE[order.status]}`} data-testid="order-status">{order.status}</span></td>
              <td>${order.total.toFixed(2)}</td>
              <td><Link to={`/orders/${order.id}`} data-testid="view-order-link">View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
