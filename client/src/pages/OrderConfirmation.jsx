import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then(setOrder);
  }, [id]);

  if (!order) return <div className="page-loading">Loading...</div>;

  return (
    <div className="empty-state" data-testid="order-confirmation-page">
      <h1>Order confirmed!</h1>
      <p>Your order <strong data-testid="confirmation-order-id">#{order.id}</strong> has been placed successfully.</p>
      <p>Total charged: <strong data-testid="confirmation-order-total">${order.total.toFixed(2)}</strong></p>
      <p>A confirmation email was sent &mdash; check the <Link to="/mock-inbox">Dev Inbox</Link> to view it.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
        <Link to={`/orders/${order.id}`} className="btn btn-primary">View order details</Link>
        <Link to="/" className="btn btn-secondary">Continue shopping</Link>
      </div>
    </div>
  );
}
