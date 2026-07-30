import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import StarRating from '../components/StarRating';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const load = () => {
    api.get(`/products/${id}`).then(setProduct).catch(() => setNotFound(true));
    api.get(`/products/${id}/reviews`).then(setReviews);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, quantity);
      showToast('Added to cart', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddToWishlist = async () => {
    try {
      await api.post('/wishlist', { productId: product.id });
      showToast('Added to wishlist', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    try {
      await api.post(`/products/${id}/reviews`, { rating: reviewRating, comment: reviewComment });
      setReviewComment('');
      setReviewRating(5);
      showToast('Review submitted', 'success');
      load();
    } catch (err) {
      setReviewError(err.message);
    }
  };

  if (notFound) return <div className="empty-state" data-testid="product-not-found">Product not found.</div>;
  if (!product) return <div className="page-loading">Loading...</div>;

  const outOfStock = product.stock === 0;

  return (
    <div data-testid="product-detail-page">
      <Link to="/">&larr; Back to products</Link>
      <div className="product-detail" style={{ marginTop: 16 }}>
        <div className="product-detail-image">
          <img src={`/images/${product.image}`} alt={product.name} />
        </div>
        <div>
          <h1 data-testid="product-name">{product.name}</h1>
          <StarRating value={product.rating_avg} count={product.rating_count} />
          <p className="product-detail-price" data-testid="product-price">${product.price.toFixed(2)}</p>
          <p>{product.description}</p>
          <p data-testid="product-stock">
            {outOfStock ? (
              <span className="badge badge-danger">Out of stock</span>
            ) : (
              <span className="badge badge-success">{product.stock} in stock</span>
            )}
          </p>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '16px 0' }}>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="qty-input"
              data-testid="quantity-input"
              disabled={outOfStock}
            />
            <button className="btn btn-primary" onClick={handleAddToCart} disabled={outOfStock} data-testid="add-to-cart-button">
              {outOfStock ? 'Out of stock' : 'Add to cart'}
            </button>
            {user && (
              <button className="btn btn-secondary" onClick={handleAddToWishlist} data-testid="add-to-wishlist-button">
                Add to wishlist
              </button>
            )}
          </div>
        </div>
      </div>

      <section style={{ marginTop: 40 }}>
        <h2>Reviews ({reviews.length})</h2>

        {user ? (
          <form className="form" onSubmit={handleSubmitReview} data-testid="review-form">
            <div className="form-row">
              <label>Your rating</label>
              <StarRating value={reviewRating} onRate={setReviewRating} />
            </div>
            <div className="form-row">
              <label htmlFor="review-comment">Comment</label>
              <textarea
                id="review-comment"
                rows="3"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                data-testid="review-comment-input"
              />
            </div>
            {reviewError && <div className="form-error" data-testid="review-error">{reviewError}</div>}
            <button type="submit" className="btn btn-primary" data-testid="submit-review-button">Submit review</button>
          </form>
        ) : (
          <p><Link to="/login">Log in</Link> to leave a review.</p>
        )}

        <div style={{ marginTop: 24 }} data-testid="review-list">
          {reviews.length === 0 && <p className="empty-state">No reviews yet.</p>}
          {reviews.map((review) => (
            <div key={review.id} className="review-item" data-testid="review-item">
              <strong>{review.user_name}</strong> <StarRating value={review.rating} size="sm" />
              <p>{review.comment}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
