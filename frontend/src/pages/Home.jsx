import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Compass } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import api from '../services/api';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [featRes, catRes] = await Promise.all([
          api.get('/products/featured'),
          api.get('/categories')
        ]);
        if (featRes.success) setFeaturedProducts(featRes.products);
        if (catRes.success) setCategories(catRes.categories);
      } catch (err) {
        console.error('Home page loading error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div>
      {/* Hero Editorial Section */}
      <section style={{
        position: 'relative',
        minHeight: '82vh',
        backgroundColor: '#0a0a0a',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.8)), url("https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '900px' }}>
          <span className="badge badge-gold" style={{ marginBottom: '1.5rem', letterSpacing: '0.2em' }}>
            AUTUMN / WINTER 2026 EDITION
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', fontWeight: 400, lineHeight: '1.1', letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
            Architectural Precision. Timeless Presence.
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#d0d0d0', lineHeight: '1.7', maxWidth: '640px', marginBottom: '2.5rem' }}>
            Discover AXI Collection — curated luxury horology timepieces, titanium optical eyewear, and minimalist mobile gear crafted for uncompromising distinction.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/products" className="btn btn-primary" style={{ backgroundColor: '#fff', color: '#000', borderColor: '#fff' }}>
              Explore Collection <ArrowRight size={16} />
            </Link>
            <Link to="/products?category=watches" className="btn btn-secondary" style={{ color: '#fff', borderColor: '#fff' }}>
              Discover Watches
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            CURATED SELECTION
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginBottom: '2.5rem' }}>
            Explore Category Houses
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {categories.map((cat) => (
              <Link 
                key={cat._id} 
                to={`/products?category=${cat.slug}`}
                style={{ position: 'relative', height: '360px', overflow: 'hidden', display: 'block', textDecoration: 'none' }}
                className="category-card"
              >
                <img 
                  src={cat.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'} 
                  alt={cat.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  color: '#fff'
                }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400 }}>{cat.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '0.4rem', lineHeight: '1.4' }}>{cat.description}</p>
                  <span style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    View House <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                HIGHLIGHTED EDITIONS
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem' }}>
                Featured Timepieces & Gear
              </h2>
            </div>
            <Link to="/products" className="btn btn-secondary btn-sm">
              View Entire Catalog <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="grid-products">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Editorial Brand Story Section */}
      <section style={{ backgroundColor: 'var(--bg-dark)', color: '#fff', padding: '6rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent-gold)' }}>
              THE AXI PHILOSOPHY
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', margin: '1rem 0 1.5rem 0', fontWeight: 400, lineHeight: '1.2' }}>
              Designed for the Discerning Few.
            </h2>
            <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              At AXI Collection, we reject mass production and cheap disposable trends. Every timepiece, frame, and leather accessory is forged with meticulous attention to tactile weight, material durability, and visual harmony.
            </p>
            <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '2rem' }}>
              We offer Cash on Delivery nationwide across Pakistan, empowering you to order with complete confidence and peace of mind.
            </p>
            <Link to="/products" className="btn btn-accent">
              Shop The New Arrival Drop
            </Link>
          </div>

          <div style={{ position: 'relative' }}>
            <img 
              src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop" 
              alt="Editorial AXI Product Shot"
              style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
            />
          </div>
        </div>
      </section>

      <style>{`
        .category-card:hover img {
          transform: scale(1.05);
        }
        @media (max-width: 900px) {
          section[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
