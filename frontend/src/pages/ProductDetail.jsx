import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Truck, ShieldCheck, ChevronRight, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/product/ProductCard';
import api from '../services/api';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    const fetchProductDetail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${slug}`);
        if (res.success) {
          setProduct(res.product);
          setActiveImage(res.product.images?.[0] || '');
          setQuantity(1);

          // Load related products
          const relRes = await api.get(`/products/${res.product._id}/related`);
          if (relRes.success) {
            setRelatedProducts(relRes.products);
          }
        }
      } catch (err) {
        console.error('Failed to fetch product details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product, quantity);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>Product Not Found</h2>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>The requested product does not exist or has been retired.</p>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Back to Catalog</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
        <Link to="/">Home</Link> <ChevronRight size={12} />
        <Link to="/products">Catalog</Link> <ChevronRight size={12} />
        <Link to={`/products?category=${product.category?.slug}`}>{product.category?.name}</Link> <ChevronRight size={12} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product.name}</span>
      </div>

      {/* Main Product Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '4rem', alignItems: 'start' }}>
        {/* Left Image Gallery */}
        <div>
          <div style={{ backgroundColor: 'var(--bg-tertiary)', aspectRatio: '4/5', width: '100%', overflow: 'hidden', marginBottom: '1rem' }}>
            <img 
              src={activeImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'} 
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Thumbnail Strip */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              {product.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  style={{
                    width: '80px',
                    height: '100px',
                    border: activeImage === imgUrl ? '2px solid var(--text-primary)' : '1px solid var(--border-light)',
                    overflow: 'hidden',
                    padding: 0
                  }}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Product Information */}
        <div>
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            {product.category?.name} {product.subCategory ? ` / ${product.subCategory.name}` : ''}
          </span>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 400, margin: '0.5rem 0 1rem 0', lineHeight: '1.2' }}>
            {product.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              PKR {product.price?.toLocaleString()}
            </span>
            {product.stock > 0 ? (
              <span className="badge badge-success">In Stock ({product.stock} units)</span>
            ) : (
              <span className="badge badge-danger">Out of Stock</span>
            )}
          </div>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            {product.description}
          </p>

          {/* Quantity & Add to Cart Controls */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Select Quantity
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', border: '1px solid var(--border-light)' }}>
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '0.6rem 1.2rem', fontSize: '1.1rem' }}
                  disabled={product.stock <= 0}
                >-</button>
                <span style={{ padding: '0.6rem 1.2rem', fontWeight: 700, fontSize: '1rem' }}>{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  style={{ padding: '0.6rem 1.2rem', fontSize: '1.1rem' }}
                  disabled={product.stock <= 0 || quantity >= product.stock}
                >+</button>
              </div>

              <button 
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.9rem 1.5rem', fontSize: '0.875rem' }}
              >
                {addedSuccess ? <><Check size={18} /> Added to Shopping Bag</> : <><ShoppingBag size={18} /> Add to Shopping Bag</>}
              </button>
            </div>
          </div>

          {/* Value Banners */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Truck size={20} style={{ color: 'var(--text-primary)' }} />
              <span><strong>Cash on Delivery (COD)</strong> available nationwide. Free shipping over PKR 20,000.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={20} style={{ color: 'var(--text-primary)' }} />
              <span>100% Guaranteed authentic product inspection upon parcel delivery.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: '6rem', borderTop: '1px solid var(--border-light)', paddingTop: '4rem' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '2rem' }}>
            Complementary House Pieces
          </h3>
          <div className="grid-products">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel._id} product={rel} />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .container > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
