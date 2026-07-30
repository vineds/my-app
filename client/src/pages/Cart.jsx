import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleQuantityChange = async (productId, quantity) => {
    try {
      await updateQuantity(productId, quantity);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRemove = async (productId) => {
    await removeFromCart(productId);
    showToast('Item removed', 'info');
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  };

  if (cart.items.length === 0) {
    return (
      <div className="empty-state" data-testid="cart-empty">
        <p>Your cart is empty.</p>
        <Link to="/" className="btn btn-primary">Browse products</Link>
      </div>
    );
  }

  return (
    <div data-testid="cart-page">
      <h1 className="page-title">Your Cart</h1>
      <table className="cart-table" data-testid="cart-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cart.items.map((item) => (
            <tr key={item.cartItemId} data-testid="cart-row" data-product-id={item.product.id}>
              <td>
                <div className="cart-row-product">
                  <img src={`/images/${item.product.image}`} alt={item.product.name} />
                  <Link to={`/products/${item.product.id}`}>{item.product.name}</Link>
                </div>
              </td>
              <td>${item.product.price.toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  max={item.product.stock}
                  value={item.quantity}
                  className="qty-input"
                  data-testid="cart-quantity-input"
                  onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value, 10) || 1)}
                />
              </td>
              <td>${(item.product.price * item.quantity).toFixed(2)}</td>
              <td>
                <button className="btn btn-secondary btn-sm" onClick={() => handleRemove(item.product.id)} data-testid="remove-cart-item-button">
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cart-summary" data-testid="cart-summary">
        <div className="cart-summary-row">
          <span>Total</span>
          <strong data-testid="cart-total">${cart.total}</strong>
        </div>
        <button className="btn btn-primary btn-block" onClick={handleCheckout} data-testid="checkout-button">
          Proceed to checkout
        </button>
        <button className="btn btn-secondary btn-block" style={{ marginTop: 10 }} onClick={() => clearCart()} data-testid="clear-cart-button">
          Clear cart
        </button>
      </div>
    </div>
  );
}
