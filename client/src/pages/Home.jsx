import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value); else next.delete(key);
    });
    if (!('page' in updates)) next.delete('page');
    setSearchParams(next);
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category, search, sort, minPrice, maxPrice, page: String(page), pageSize: '12' });
      const result = await api.get(`/products?${params.toString()}`);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, minPrice, maxPrice, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    api.get('/products/categories').then(setCategories);
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      showToast('Added to cart', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div data-testid="home-page">
      <h1 className="page-title">Products</h1>

      <div className="toolbar" data-testid="filter-toolbar">
        <div className="form-row">
          <label htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            value={category}
            onChange={(e) => updateParams({ category: e.target.value === 'all' ? '' : e.target.value })}
            data-testid="filter-category"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="filter-sort">Sort by</label>
          <select
            id="filter-sort"
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            data-testid="filter-sort"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="filter-min">Min price</label>
          <input
            id="filter-min"
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => updateParams({ minPrice: e.target.value })}
            data-testid="filter-min-price"
          />
        </div>

        <div className="form-row">
          <label htmlFor="filter-max">Max price</label>
          <input
            id="filter-max"
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => updateParams({ maxPrice: e.target.value })}
            data-testid="filter-max-price"
          />
        </div>

        {(category !== 'all' || search || sort !== 'newest' || minPrice || maxPrice) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSearchParams({})}
            data-testid="clear-filters-button"
          >
            Clear filters
          </button>
        )}
      </div>

      {search && (
        <p data-testid="search-summary">
          Showing results for <strong>"{search}"</strong>
        </p>
      )}

      {loading ? (
        <div className="page-loading" data-testid="products-loading">Loading products...</div>
      ) : data.items.length === 0 ? (
        <div className="empty-state" data-testid="products-empty">No products match your filters.</div>
      ) : (
        <>
          <div className="product-grid" data-testid="product-grid">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => updateParams({ page: String(p) })} />
        </>
      )}
    </div>
  );
}
