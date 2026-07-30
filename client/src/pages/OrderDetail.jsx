import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(setOrder).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <div className="empty-state" data-testid="order-not-found">Order not found.</div>;
  if (!order) return <div className="page-loading">Loading...</div>;

  return (
    <div data-testid="order-detail-page">
      <Link to="/orders">&larr; Back to orders</Link>
      <h1 className="page-title">Order #{order.id}</h1>
      <p>Status: <span className="badge badge-info" data-testid="order-detail-status">{order.status}</span></p>
      <p>Placed on {new Date(order.created_at).toLocaleString()}</p>

      <h3>Shipping to</h3>
      <p>{order.shipping_name}<br />{order.shipping_address}<br />{order.shipping_city}, {order.shipping_zip}, {order.shipping_country}</p>

      <h3>Items</h3>
      <table className="data-table" data-testid="order-items-table">
        <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>${item.price.toFixed(2)}</td>
              <td>{item.quantity}</td>
              <td>${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cart-summary" data-testid="order-total-summary">
        <div className="cart-summary-row"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
        {order.discount > 0 && (
          <div className="cart-summary-row"><span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span><span>-${order.discount.toFixed(2)}</span></div>
        )}
        <div className="cart-summary-row"><strong>Total</strong><strong>${order.total.toFixed(2)}</strong></div>
      </div>
    </div>
  );
}
