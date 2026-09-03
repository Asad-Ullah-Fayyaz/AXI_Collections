import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Dark Overlay */}
      <div 
        onClick={() => setIsCartOpen(false)}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} 
      />

      {/* Slide-out Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#fff',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
        zIndex: 2001
      }}>
        {/* Drawer Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>Shopping Bag</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({cart.itemCount})</span>
          </div>
          <button onClick={() => setIsCartOpen(false)} style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Your shopping bag is currently empty.</p>
              <button onClick={() => setIsCartOpen(false)} className="btn btn-primary btn-sm">
                Explore Collections
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {cart.items.map((item) => (
                <div key={item.product._id} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
                  <img 
                    src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'} 
                    alt={item.product.name}
                    style={{ width: '80px', height: '100px', objectFit: 'cover', backgroundColor: 'var(--bg-tertiary)' }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.product.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        PKR {item.product.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <div style={{ display: 'inline-flex', border: '1px solid var(--border-light)', borderRadius: '2px' }}>
                        <button 
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.9rem' }}
                        >-</button>
                        <span style={{ padding: '0.2rem 0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.9rem' }}
                        >+</button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.product._id)}
                        style={{ color: 'var(--text-muted)' }}
                        title="Remove Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.items.length > 0 && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 700 }}>PKR {cart.subtotal.toLocaleString()}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Taxes included. Cash on Delivery nationwide.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={() => { setIsCartOpen(false); navigate('/checkout'); }} 
                className="btn btn-primary btn-full"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => { setIsCartOpen(false); navigate('/cart'); }} 
                className="btn btn-secondary btn-full"
              >
                View Full Shopping Bag
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
