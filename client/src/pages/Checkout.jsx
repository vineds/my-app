import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const STEPS = ['Shipping', 'Payment', 'Review'];

export default function Checkout() {
  const { cart, refreshCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState({ name: '', address: '', city: '', zip: '', country: 'US' });
  const [payment, setPayment] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (cart.items.length === 0) {
    return <div className="empty-state" data-testid="checkout-empty">Your cart is empty. Add items before checking out.</div>;
  }

  const subtotal = parseFloat(cart.total);
  const discount = couponResult ? +(subtotal * (couponResult.discountPercent / 100)).toFixed(2) : 0;
  const total = +(subtotal - discount).toFixed(2);

  const validateStep = () => {
    if (step === 0) {
      return shipping.name && shipping.address && shipping.city && shipping.zip;
    }
    if (step === 1) {
      return payment.cardNumber && payment.expiry && payment.cvv;
    }
    return true;
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponResult(null);
    if (!couponCode.trim()) return;
    try {
      const result = await api.post('/coupons/validate', { code: couponCode.trim() });
      setCouponResult(result);
    } catch (err) {
      setCouponError(err.message);
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await api.post('/checkout', {
        shipping,
        payment,
        couponCode: couponResult ? couponResult.code : undefined
      });
      await refreshCart();
      showToast('Order placed!', 'success');
      navigate(`/order-confirmation/${result.order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="checkout-page">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout-steps" data-testid="checkout-steps">
        {STEPS.map((label, i) => (
          <span key={label} className={`checkout-step ${i === step ? 'active' : ''}`} data-testid={`checkout-step-${label.toLowerCase()}`}>
            {i + 1}. {label}
          </span>
        ))}
      </div>

      <div className="checkout-layout">
        <div>
          {step === 0 && (
            <div className="form" data-testid="shipping-form">
              <div className="form-row">
                <label htmlFor="ship-name">Full name</label>
                <input id="ship-name" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} data-testid="shipping-name-input" />
              </div>
              <div className="form-row">
                <label htmlFor="ship-address">Address</label>
                <input id="ship-address" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} data-testid="shipping-address-input" />
              </div>
              <div className="form-grid">
                <div className="form-row">
                  <label htmlFor="ship-city">City</label>
                  <input id="ship-city" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} data-testid="shipping-city-input" />
                </div>
                <div className="form-row">
                  <label htmlFor="ship-zip">ZIP code</label>
                  <input id="ship-zip" value={shipping.zip} onChange={(e) => setShipping({ ...shipping, zip: e.target.value })} data-testid="shipping-zip-input" />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="ship-country">Country</label>
                <input id="ship-country" value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} data-testid="shipping-country-input" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="form" data-testid="payment-form">
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                This is a mock payment form for testing purposes only. No real card is charged &mdash; any values work.
              </p>
              <div className="form-row">
                <label htmlFor="pay-card">Card number</label>
                <input id="pay-card" value={payment.cardNumber} onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })} placeholder="4242 4242 4242 4242" data-testid="payment-card-input" />
              </div>
              <div className="form-grid">
                <div className="form-row">
                  <label htmlFor="pay-expiry">Expiry (MM/YY)</label>
                  <input id="pay-expiry" value={payment.expiry} onChange={(e) => setPayment({ ...payment, expiry: e.target.value })} placeholder="12/28" data-testid="payment-expiry-input" />
                </div>
                <div className="form-row">
                  <label htmlFor="pay-cvv">CVV</label>
                  <input id="pay-cvv" value={payment.cvv} onChange={(e) => setPayment({ ...payment, cvv: e.target.value })} placeholder="123" data-testid="payment-cvv-input" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div data-testid="review-step">
              <h3>Shipping to</h3>
              <p>{shipping.name}<br />{shipping.address}<br />{shipping.city}, {shipping.zip}, {shipping.country}</p>
              <h3>Payment</h3>
              <p>Card ending in {payment.cardNumber.replace(/\s/g, '').slice(-4)}</p>
              <h3>Items</h3>
              <ul>
                {cart.items.map((item) => (
                  <li key={item.cartItemId}>{item.product.name} &times; {item.quantity} &mdash; ${(item.product.price * item.quantity).toFixed(2)}</li>
                ))}
              </ul>
            </div>
          )}

          {error && <div className="form-error" data-testid="checkout-error">{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {step > 0 && <button className="btn btn-secondary" onClick={() => setStep(step - 1)} data-testid="checkout-back-button">Back</button>}
            {step < STEPS.length - 1 && <button className="btn btn-primary" onClick={handleNext} data-testid="checkout-next-button">Continue</button>}
            {step === STEPS.length - 1 && (
              <button className="btn btn-primary" onClick={handlePlaceOrder} disabled={submitting} data-testid="place-order-button">
                {submitting ? 'Placing order...' : 'Place order'}
              </button>
            )}
          </div>
        </div>

        <div className="cart-summary" data-testid="order-summary">
          <h3 style={{ marginTop: 0 }}>Order Summary</h3>
          <div className="cart-summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          {couponResult && (
            <div className="cart-summary-row"><span>Discount ({couponResult.discountPercent}%)</span><span>-${discount.toFixed(2)}</span></div>
          )}
          <div className="cart-summary-row"><strong>Total</strong><strong data-testid="checkout-total">${total.toFixed(2)}</strong></div>

          <div className="form-row" style={{ marginTop: 14 }}>
            <label htmlFor="coupon-code">Coupon code</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input id="coupon-code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} data-testid="coupon-input" />
              <button className="btn btn-secondary btn-sm" onClick={handleApplyCoupon} data-testid="apply-coupon-button">Apply</button>
            </div>
            {couponError && <div className="form-error" data-testid="coupon-error">{couponError}</div>}
            {couponResult && <div className="form-success" data-testid="coupon-success">Applied {couponResult.code}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
