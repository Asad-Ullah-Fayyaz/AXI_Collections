import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop';
  const secondaryImage = product.images?.[1] || primaryImage;

  return (
    <div className="product-card">
      <Link to={`/products/${product.slug}`}>
        <div className="product-image-container">
          <img src={primaryImage} alt={product.name} className="product-image-primary" />
          <img src={secondaryImage} alt={`${product.name} alternate view`} className="product-image-secondary" />

          {/* Badges Overlay */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {product.isFeatured && <span className="badge badge-gold">Featured</span>}
            {product.stock <= 0 && <span className="badge badge-danger">Out of Stock</span>}
            {product.stock > 0 && product.stock <= 5 && <span className="badge badge-warning">Low Stock ({product.stock})</span>}
          </div>
        </div>
      </Link>

      <div style={{ padding: '1rem 0' }}>
        {/* Category tag */}
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
          {product.category?.name || 'Accessories'}
        </p>

        {/* Product Title */}
        <Link to={`/products/${product.slug}`}>
          <h3 style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.4', marginBottom: '0.4rem' }}>
            {product.name}
          </h3>
        </Link>

        {/* Price & Add to Cart */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            PKR {product.price?.toLocaleString()}
          </span>

          <button 
            onClick={() => addToCart(product, 1)}
            disabled={product.stock <= 0}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.4rem 0.75rem' }}
            title="Add to Shopping Bag"
          >
            <ShoppingBag size={14} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
