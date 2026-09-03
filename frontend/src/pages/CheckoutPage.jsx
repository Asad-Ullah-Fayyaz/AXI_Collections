import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, ArrowLeft, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.addresses?.[0]?.phone || '',
    street: user?.addresses?.[0]?.street || '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || 'Punjab',
    postalCode: user?.addresses?.[0]?.postalCode || '',
    country: 'Pakistan',
    orderNotes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const shippingCost = cart.subtotal >= 20000 ? 0 : 350;
  const grandTotal = cart.subtotal + shippingCost;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (cart.items.length === 0) {
      setErrorMsg('Your shopping bag is empty.');
      return;
    }

    setSubmitting(true);

    try {
      const orderPayload = {
        items: cart.items.map(item => ({
          productId: item.product._id,
          name: item.product.name,
          quantity: item.quantity
        })),
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country
        },
        orderNotes: formData.orderNotes
      };

      const res = await api.post('/orders', orderPayload);

      if (res.success) {
        clearCart();
        navigate(`/order-confirmation?orderId=${res.order.orderId}`);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>Shopping Bag is Empty</h2>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Please add items to your cart before proceeding to checkout.</p>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Return to Shop</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <Link to="/cart" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
          <ArrowLeft size={14} /> Back to Bag
        </Link>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem' }}>
          Checkout — Cash on Delivery
        </h1>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#fce8e6', color: '#c5221f', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '2rem', fontSize: '0.875rem' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem' }}>
        {/* Shipping Form */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            1. Delivery Address & Contact
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input 
                type="text" 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleChange} 
                required 
                className="form-input"
                placeholder="e.g. Alexander Wright"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                required 
                className="form-input"
                placeholder="e.g. 0300 1234567"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (For Confirmation & Courier Tracking) *</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="form-input"
              placeholder="e.g. alexander@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Street Address / Suite / Landmark *</label>
            <input 
              type="text" 
              name="street" 
              value={formData.street} 
              onChange={handleChange} 
              required 
              className="form-input"
              placeholder="e.g. House 14, Street 7, Sector F-8/3"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">City *</label>
              <input 
                type="text" 
                name="city" 
                value={formData.city} 
                onChange={handleChange} 
                required 
                className="form-input"
                placeholder="e.g. Islamabad"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Province / State</label>
              <input 
                type="text" 
                name="state" 
                value={formData.state} 
                onChange={handleChange} 
                className="form-input"
                placeholder="e.g. Federal"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Postal Code *</label>
              <input 
                type="text" 
                name="postalCode" 
                value={formData.postalCode} 
                onChange={handleChange} 
                required 
                className="form-input"
                placeholder="e.g. 44000"
              />
            </div>
          </div>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', margin: '2.5rem 0 1.5rem 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            2. Payment Method
          </h3>

          <div style={{ border: '2px solid var(--bg-dark)', padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={20} style={{ color: 'var(--bg-dark)' }} />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Cash on Delivery (COD)</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pay cash to courier agent upon parcel delivery & inspection.</p>
              </div>
            </div>
            <span className="badge badge-dark">Active</span>
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="form-label">Delivery Notes / Special Instructions (Optional)</label>
            <textarea 
              name="orderNotes" 
              value={formData.orderNotes} 
              onChange={handleChange} 
              rows={3} 
              className="form-textarea"
              placeholder="e.g. Please call before arrival or leave with security gate."
            />
          </div>
        </div>

        {/* Order Review Sidebar */}
        <div>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.75rem', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              Items Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '280px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
              {cart.items.map((item) => (
                <div key={item.product._id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <img 
                    src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'} 
                    alt={item.product.name}
                    style={{ width: '48px', height: '60px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.product.name}</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty: {item.quantity} &bull; PKR {item.product.price.toLocaleString()}</p>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    PKR {(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Subtotal</span>
                <span>PKR {cart.subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'FREE' : `PKR ${shippingCost}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 700, marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                <span>Grand Total</span>
                <span>PKR {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitting} 
              className="btn btn-primary btn-full"
              style={{ marginTop: '1.75rem', padding: '1rem' }}
            >
              {submitting ? 'Confirming Order...' : 'Confirm COD Order'}
            </button>
          </div>
        </div>
      </form>

      <style>{`
        @media (max-width: 900px) {
          form[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
