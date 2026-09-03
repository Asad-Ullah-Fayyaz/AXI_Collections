import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { ArrowLeft, Upload, Plus, Trash2, Save } from 'lucide-react';
import api from '../services/api';

export default function AdminProductEdit() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    subCategory: '',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'],
    isFeatured: false,
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.success) setCategories(res.categories);
      } catch (err) {
        console.error('Failed to load categories:', err.message);
      }
    };
    loadCategories();

    if (isEditMode) {
      const loadProduct = async () => {
        setLoading(true);
        try {
          // Fetch product by searching or direct route
          const res = await api.get(`/products?limit=100`);
          if (res.success) {
            const p = res.products.find(item => item._id === id);
            if (p) {
              setFormData({
                name: p.name,
                description: p.description,
                price: p.price,
                stock: p.stock,
                category: p.category?._id || p.category || '',
                subCategory: p.subCategory?._id || p.subCategory || '',
                images: p.images && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'],
                isFeatured: p.isFeatured,
                isActive: p.isActive
              });
            }
          }
        } catch (err) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      };
      loadProduct();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setFormData({ ...formData, images: [...formData.images, imageUrlInput.trim()] });
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (idx) => {
    const updated = formData.images.filter((_, i) => i !== idx);
    setFormData({ ...formData, images: updated });
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append('images', files[i]);
    }

    setUploading(true);
    try {
      const res = await api.post('/products/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        setFormData({ ...formData, images: [...formData.images, ...res.images] });
      }
    } catch (err) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/products/${id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      navigate('/admin/products');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const selectedCatObj = categories.find(c => c._id === formData.category);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, padding: '2.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/admin/products" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
            <ArrowLeft size={14} /> Back to Products List
          </Link>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem' }}>
            {isEditMode ? 'Edit Catalog Product' : 'Create New Product'}
          </h1>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fce8e6', color: '#c5221f', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '2rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-subtle)', maxWidth: '900px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                className="form-input" 
                placeholder="e.g. AXI Royal Chronograph Obsidian"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Parent Category *</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange} 
                required 
                className="form-select"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Sub-Category (Optional)</label>
              <select 
                name="subCategory" 
                value={formData.subCategory} 
                onChange={handleChange} 
                className="form-select"
              >
                <option value="">None</option>
                {selectedCatObj?.subCategories?.map((sub) => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Price (PKR) *</label>
              <input 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                required 
                min="0" 
                className="form-input" 
                placeholder="e.g. 24900"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stock Quantity *</label>
              <input 
                type="number" 
                name="stock" 
                value={formData.stock} 
                onChange={handleChange} 
                required 
                min="0" 
                className="form-input" 
                placeholder="e.g. 15"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Product Description *</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              required 
              rows={4} 
              className="form-textarea" 
              placeholder="Describe materials, movement specs, craftsmanship details..."
            />
          </div>

          {/* Product Image Management */}
          <div className="form-group" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <label className="form-label">Product Images (Hover & Gallery)</label>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {formData.images.map((imgUrl, idx) => (
                <div key={idx} style={{ position: 'relative', width: '90px', height: '110px', border: '1px solid var(--border-light)' }}>
                  <img src={imgUrl} alt={`Product ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveImage(idx)} 
                    style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px', borderRadius: '50%' }}
                  >
                    <Trash2 size={12} />
                  </button>
                  {idx === 0 && <span className="badge badge-dark" style={{ position: 'absolute', bottom: '2px', left: '2px', fontSize: '0.6rem' }}>Primary</span>}
                  {idx === 1 && <span className="badge badge-gold" style={{ position: 'absolute', bottom: '2px', left: '2px', fontSize: '0.6rem' }}>Hover 2nd</span>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Enter image URL..." 
                value={imageUrlInput} 
                onChange={(e) => setImageUrlInput(e.target.value)} 
                className="form-input"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={handleAddImageUrl} className="btn btn-secondary btn-sm">
                <Plus size={14} /> Add URL
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Or upload local image files:
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: 'block', marginTop: '0.4rem' }} />
              {uploading && <span>Uploading file...</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', margin: '1.5rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="isFeatured" 
                checked={formData.isFeatured} 
                onChange={handleChange} 
              />
              Featured Product (Showcase on Homepage)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="isActive" 
                checked={formData.isActive} 
                onChange={handleChange} 
              />
              Active in Catalog
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <Link to="/admin/products" className="btn btn-secondary">Cancel</Link>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Save size={16} /> {loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
