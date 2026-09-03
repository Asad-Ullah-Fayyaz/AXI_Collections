import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const freeShippingThreshold = 20000;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - cart.subtotal);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
        Your Shopping Bag
      </h1>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
        Review your luxury accessories before proceeding to Cash on Delivery checkout
      </p>

      {cart.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
          <ShoppingBag size={56} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Your shopping bag is empty</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Discover our latest timepieces and sunglasses collections.</p>
          <Link to="/products" className="btn btn-primary">Explore Catalog</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '3rem', alignItems: 'start' }}>
          {/* Main Cart Items Table */}
          <div>
            {/* Free Shipping Progress Indicator */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem 1.25rem', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
              {amountNeededForFreeShipping > 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Add <strong>PKR {amountNeededForFreeShipping.toLocaleString()}</strong> more to unlock <strong>Free Shipping</strong>.
                </p>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#137333', fontWeight: 600 }}>
                  &check; You qualify for Complimentary Express Nationwide Shipping!
                </p>
              )}
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.product._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img 
                            src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'} 
                            alt={item.product.name}
                            style={{ width: '64px', height: '80px', objectFit: 'cover', backgroundColor: 'var(--bg-tertiary)' }}
                          />
                          <div>
                            <Link to={`/products/${item.product.slug}`} style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {item.product.name}
                            </Link>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.product.category?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.9rem' }}>
                        PKR {item.product.price.toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', border: '1px solid var(--border-light)' }}>
                          <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} style={{ padding: '0.3rem 0.6rem' }}>-</button>
                          <span style={{ padding: '0.3rem 0.6rem', fontWeight: 600, fontSize: '0.85rem' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} style={{ padding: '0.3rem 0.6rem' }}>+</button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem' }}>
                        PKR {(item.product.price * item.quantity).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => removeFromCart(item.product._id)} style={{ color: 'var(--text-muted)' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button onClick={clearCart} className="btn btn-secondary btn-sm" style={{ color: 'red', borderColor: '#ffcccc' }}>
                Clear Shopping Bag
              </button>
              <Link to="/products" className="btn btn-secondary btn-sm">
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.75rem', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              Order Summary
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Bag Subtotal</span>
              <span>PKR {cart.subtotal.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estimated Shipping</span>
              <span>{cart.subtotal >= freeShippingThreshold ? 'FREE' : 'PKR 350'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment Method</span>
              <strong style={{ fontSize: '0.8rem' }}>Cash on Delivery</strong>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700 }}>
              <span>Total Amount</span>
              <span>PKR {(cart.subtotal + (cart.subtotal >= freeShippingThreshold ? 0 : 350)).toLocaleString()}</span>
            </div>

            <button onClick={() => navigate('/checkout')} className="btn btn-primary btn-full">
              Proceed to Checkout <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .container > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
