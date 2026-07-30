import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AdminTabs from '../../components/AdminTabs';

const EMPTY_FORM = { name: '', description: '', price: '', category: '', image: 'placeholder.svg', stock: '', low_stock_threshold: '5' };

export default function AdminProducts() {
  const [products, setProducts] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const load = () => api.get('/products?pageSize=100').then((data) => setProducts(data.items));

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setForm({
      name: product.name, description: product.description, price: String(product.price),
      category: product.category, image: product.image, stock: String(product.stock),
      low_stock_threshold: String(product.low_stock_threshold)
    });
    setEditingId(product.id);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock, 10), low_stock_threshold: parseInt(form.low_stock_threshold, 10) };
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        showToast('Product updated', 'success');
      } else {
        await api.post('/products', payload);
        showToast('Product created', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    showToast('Product deleted', 'info');
    load();
  };

  return (
    <div data-testid="admin-products-page">
      <h1 className="page-title">Admin</h1>
      <AdminTabs />

      <div className="section-header">
        <h2 style={{ margin: 0 }}>Products</h2>
        <button className="btn btn-primary" onClick={openCreate} data-testid="new-product-button">New product</button>
      </div>

      {!products ? (
        <div className="page-loading">Loading...</div>
      ) : (
        <table className="data-table" data-testid="admin-products-table">
          <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} data-testid="admin-product-row" data-product-id={product.id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>{product.stock}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(product)} data-testid="edit-product-button">Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product.id)} data-testid="delete-product-button">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="product-modal">
            <h2>{editingId ? 'Edit product' : 'New product'}</h2>
            <form className="form" onSubmit={handleSubmit} data-testid="product-form">
              <div className="form-row">
                <label htmlFor="pf-name">Name</label>
                <input id="pf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="product-name-input" />
              </div>
              <div className="form-row">
                <label htmlFor="pf-desc">Description</label>
                <textarea id="pf-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="product-description-input" />
              </div>
              <div className="form-grid">
                <div className="form-row">
                  <label htmlFor="pf-price">Price</label>
                  <input id="pf-price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required data-testid="product-price-input" />
                </div>
                <div className="form-row">
                  <label htmlFor="pf-category">Category</label>
                  <input id="pf-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required data-testid="product-category-input" />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-row">
                  <label htmlFor="pf-stock">Stock</label>
                  <input id="pf-stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required data-testid="product-stock-input" />
                </div>
                <div className="form-row">
                  <label htmlFor="pf-threshold">Low stock threshold</label>
                  <input id="pf-threshold" type="number" min="0" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} data-testid="product-threshold-input" />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="pf-image">Image filename</label>
                <input id="pf-image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} data-testid="product-image-input" />
              </div>
              {error && <div className="form-error" data-testid="product-form-error">{error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" data-testid="product-form-submit-button">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)} data-testid="product-form-cancel-button">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
