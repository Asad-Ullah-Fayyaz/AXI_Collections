import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';
import { Plus, Edit, Layers } from 'lucide-react';
import api from '../services/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // New SubCategory Form
  const [selectedParentId, setSelectedParentId] = useState('');
  const [newSubName, setNewSubName] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (res.success) {
        setCategories(res.categories);
        if (res.categories.length > 0 && !selectedParentId) {
          setSelectedParentId(res.categories[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.post('/categories', { name: newCatName.trim(), description: newCatDesc.trim() });
      setNewCatName('');
      setNewCatDesc('');
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateSubCategory = async (e) => {
    e.preventDefault();
    if (!newSubName.trim() || !selectedParentId) return;
    try {
      await api.post('/categories/subcategory', { name: newSubName.trim(), categoryId: selectedParentId });
      setNewSubName('');
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, padding: '2.5rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>ADMINISTRATION</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginTop: '2px' }}>Category Hierarchy (2-Level)</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          {/* Create Top Category */}
          <div style={{ backgroundColor: '#fff', padding: '1.75rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-subtle)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '1.25rem' }}>Add Top Category</h3>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input 
                  type="text" 
                  value={newCatName} 
                  onChange={(e) => setNewCatName(e.target.value)} 
                  required 
                  className="form-input"
                  placeholder="e.g. Smart Accessories"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  value={newCatDesc} 
                  onChange={(e) => setNewCatDesc(e.target.value)} 
                  className="form-input"
                  placeholder="Brief description"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm btn-full">
                <Plus size={14} /> Create Category
              </button>
            </form>
          </div>

          {/* Create 2nd Level Subcategory */}
          <div style={{ backgroundColor: '#fff', padding: '1.75rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-subtle)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '1.25rem' }}>Add 2nd Level Sub-Category</h3>
            <form onSubmit={handleCreateSubCategory}>
              <div className="form-group">
                <label className="form-label">Select Parent Category *</label>
                <select 
                  value={selectedParentId} 
                  onChange={(e) => setSelectedParentId(e.target.value)} 
                  className="form-select"
                >
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sub-Category Name *</label>
                <input 
                  type="text" 
                  value={newSubName} 
                  onChange={(e) => setNewSubName(e.target.value)} 
                  required 
                  className="form-input"
                  placeholder="e.g. Leather Straps"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm btn-full">
                <Plus size={14} /> Create Sub-Category
              </button>
            </form>
          </div>
        </div>

        {/* Existing Hierarchy Table */}
        <div style={{ backgroundColor: '#fff', padding: '1.75rem', border: '1px solid var(--border-light)', marginTop: '2.5rem', boxShadow: 'var(--shadow-subtle)' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '1.5rem' }}>Current Store Categories</h3>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Slug</th>
                    <th>Sub-Categories</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat._id}>
                      <td style={{ fontWeight: 700 }}>{cat.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.slug}</td>
                      <td>
                        {cat.subCategories && cat.subCategories.length > 0 ? (
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {cat.subCategories.map(sub => (
                              <span key={sub._id} className="badge badge-dark">{sub.name}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-success">Active</span>
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
