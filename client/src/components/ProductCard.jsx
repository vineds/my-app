import { Link } from 'react-router-dom';
import StarRating from './StarRating';

export default function ProductCard({ product, onAddToCart }) {
  const outOfStock = product.stock === 0;
  const lowStock = !outOfStock && product.stock <= (product.low_stock_threshold ?? 5);

  return (
    <div className="product-card" data-testid="product-card" data-product-id={product.id}>
      <Link to={`/products/${product.id}`} className="product-card-image" data-testid="product-card-link">
        <img src={`/images/${product.image}`} alt={product.name} loading="lazy" />
      </Link>
      <div className="product-card-body">
        <Link to={`/products/${product.id}`} className="product-card-name" data-testid="product-card-name">
          {product.name}
        </Link>
        <div className="product-card-category">{product.category}</div>
        <StarRating value={product.rating_avg} count={product.rating_count} size="sm" />
        <div className="product-card-footer">
          <span className="product-card-price" data-testid="product-card-price">${product.price.toFixed(2)}</span>
          {outOfStock ? (
            <span className="badge badge-danger" data-testid="stock-badge">Out of stock</span>
          ) : lowStock ? (
            <span className="badge badge-warning" data-testid="stock-badge">Only {product.stock} left</span>
          ) : null}
        </div>
        <button
          className="btn btn-primary btn-block"
          disabled={outOfStock}
          onClick={() => onAddToCart(product.id)}
          data-testid="add-to-cart-button"
        >
          {outOfStock ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}
