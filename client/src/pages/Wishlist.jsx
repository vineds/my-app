import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function Wishlist() {
  const [items, setItems] = useState(null);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const load = () => api.get('/wishlist').then(setItems);

  useEffect(() => { load(); }, []);

  const handleRemove = async (productId) => {
    await api.delete(`/wishlist/${productId}`);
    showToast('Removed from wishlist', 'info');
    load();
  };

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      showToast('Added to cart', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!items) return <div className="page-loading">Loading...</div>;

  if (items.length === 0) {
    return (
      <div className="empty-state" data-testid="wishlist-empty">
        <p>Your wishlist is empty.</p>
        <Link to="/" className="btn btn-primary">Browse products</Link>
      </div>
    );
  }

  return (
    <div data-testid="wishlist-page">
      <h1 className="page-title">Your Wishlist</h1>
      <table className="cart-table" data-testid="wishlist-table">
        <thead>
          <tr><th>Product</th><th>Price</th><th></th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.wishlist_item_id} data-testid="wishlist-row" data-product-id={item.id}>
              <td>
                <div className="cart-row-product">
                  <img src={`/images/${item.image}`} alt={item.name} />
                  <Link to={`/products/${item.id}`}>{item.name}</Link>
                </div>
              </td>
              <td>${item.price.toFixed(2)}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => handleAddToCart(item.id)} data-testid="wishlist-add-to-cart-button">
                  Add to cart
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleRemove(item.id)} data-testid="wishlist-remove-button">
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
