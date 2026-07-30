import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/?search=${encodeURIComponent(query.trim())}` : '/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" data-testid="nav-home-link">TechMart</Link>

        <form className="nav-search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="nav-search-input"
            aria-label="Search products"
          />
          <button type="submit" data-testid="nav-search-submit">Search</button>
        </form>

        <nav className="nav-links">
          <Link to="/" data-testid="nav-products-link">Products</Link>
          {user && <Link to="/wishlist" data-testid="nav-wishlist-link">Wishlist</Link>}
          {user && <Link to="/orders" data-testid="nav-orders-link">Orders</Link>}
          <Link to="/cart" data-testid="nav-cart-link">
            Cart{itemCount > 0 && <span className="cart-badge" data-testid="cart-badge">{itemCount}</span>}
          </Link>
          {user?.role === 'admin' && <Link to="/admin" data-testid="nav-admin-link">Admin</Link>}
          <Link to="/mock-inbox" data-testid="nav-mock-inbox-link" title="Mock email outbox for testing">Dev Inbox</Link>

          {user ? (
            <div className="nav-user-menu">
              <Link to="/profile" data-testid="nav-profile-link">{user.name}</Link>
              <button onClick={handleLogout} className="link-button" data-testid="nav-logout-button">Logout</button>
            </div>
          ) : (
            <>
              <Link to="/login" data-testid="nav-login-link">Login</Link>
              <Link to="/register" data-testid="nav-register-link">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
