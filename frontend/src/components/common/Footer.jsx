import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--bg-dark)', color: '#fff', paddingTop: '4rem', paddingBottom: '2rem', marginTop: '6rem' }}>
      {/* Brand Value Pillars */}
      <div className="container" style={{ borderBottom: '1px solid #222', paddingBottom: '3rem', marginBottom: '3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Truck size={28} style={{ color: 'var(--accent-gold)' }} />
            <div>
              <h4 style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Express Delivery</h4>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>Nationwide Cash on Delivery</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck size={28} style={{ color: 'var(--accent-gold)' }} />
            <div>
              <h4 style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Guaranteed Quality</h4>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>100% Authentic Product Craft</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <RotateCcw size={28} style={{ color: 'var(--accent-gold)' }} />
            <div>
              <h4 style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hassle-Free Inspection</h4>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>Inspect package upon delivery</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Clock size={28} style={{ color: 'var(--accent-gold)' }} />
            <div>
              <h4 style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Dedicated Concierge</h4>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>Support Mon-Sat 9AM-8PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: '3rem', borderBottom: '1px solid #222', paddingBottom: '3rem' }}>
        {/* Brand Narrative */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            AXI COLLECTION
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#999', lineHeight: '1.7', maxWidth: '340px' }}>
            AXI Collection is a contemporary house of refined lifestyle accessories. We design and curate luxury timepieces, optical eyewear, and minimalist technical gear for discerning individuals.
          </p>
        </div>

        {/* Collections Links */}
        <div>
          <h4 style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.25rem', color: '#888' }}>
            Collections
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: '#ccc' }}>
            <li><Link to="/products?category=watches">Timepieces & Watches</Link></li>
            <li><Link to="/products?category=glasses">Eyewear & Sunglasses</Link></li>
            <li><Link to="/products?category=mobile-accessories">Mobile Accessories</Link></li>
            <li><Link to="/products">All Products</Link></li>
          </ul>
        </div>

        {/* Client Services Links */}
        <div>
          <h4 style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.25rem', color: '#888' }}>
            Client Services
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: '#ccc' }}>
            <li><Link to="/track-order">Track Your Order</Link></li>
            <li><Link to="/checkout">Cash on Delivery Info</Link></li>
            <li><Link to="/login">My Account</Link></li>
            <li><a href="mailto:support@axicollection.com">Contact Support</a></li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div>
          <h4 style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.25rem', color: '#888' }}>
            The Private List
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: '1rem' }}>
            Subscribe to receive private invitations to limited production runs and new arrival drops.
          </p>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="email"
              placeholder="Enter email address"
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                color: '#fff',
                padding: '0.6rem 0.8rem',
                fontSize: '0.8rem',
                flex: 1,
                outline: 'none'
              }}
            />
            <button type="submit" className="btn btn-accent btn-sm">Join</button>
          </form>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="container" style={{ paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#666', flexWrap: 'wrap', gap: '1rem' }}>
        <p>&copy; {new Date().getFullYear()} AXI Collection. All rights reserved. Production-Ready E-Commerce Architecture.</p>
        <p style={{ letterSpacing: '0.05em' }}>Payment Mode: <strong>CASH ON DELIVERY (COD)</strong></p>
      </div>

      <style>{`
        @media (max-width: 900px) {
          footer .container {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          footer .container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
