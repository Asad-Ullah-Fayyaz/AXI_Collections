import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { Plus, Edit, Trash2, Star, CheckCircle, Search } from 'lucide-react';
import api from '../services/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`);
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleToggleFeatured = async (id, currentVal) => {
    try {
      await api.put(`/products/${id}`, { isFeatured: !currentVal });
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (id, currentVal) => {
    try {
      await api.put(`/products/${id}`, { isActive: !currentVal });
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete product '${name}'?`)) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>ADMINISTRATION</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginTop: '2px' }}>Product Inventory Manager</h1>
          </div>

          <Link to="/admin/products/new" className="btn btn-primary">
            <Plus size={16} /> Add New Product
          </Link>
        </div>

        {/* Search filter */}
        <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="Search products by name..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="form-input"
          />
        </div>

        {/* Products Table */}
        <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-subtle)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
              <div className="spinner"></div>
            </div>
          ) : products.length === 0 ? (
            <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No products found in catalog.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Featured</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'} alt={p.name} style={{ width: '48px', height: '60px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{p.category?.name || 'Uncategorized'}</td>
                      <td style={{ fontWeight: 700 }}>PKR {p.price.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${p.stock > 5 ? 'badge-dark' : 'badge-warning'}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleToggleFeatured(p._id, p.isFeatured)} 
                          style={{ color: p.isFeatured ? '#C5A059' : '#ccc' }}
                          title="Toggle Featured"
                        >
                          <Star size={18} fill={p.isFeatured ? '#C5A059' : 'none'} />
                        </button>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleToggleActive(p._id, p.isActive)} 
                          className={`badge ${p.isActive ? 'badge-success' : 'badge-danger'}`}
                        >
                          {p.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button 
                            onClick={() => navigate(`/admin/products/edit/${p._id}`)} 
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.5rem' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p._id, p.name)} 
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.5rem', color: 'red', borderColor: '#ffcccc' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
