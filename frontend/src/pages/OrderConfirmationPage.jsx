import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Truck, Package, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.success) {
          setOrder(res.order);
        }
      } catch (err) {
        console.error('Failed to load order confirmation:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <CheckCircle size={64} style={{ color: '#137333', marginBottom: '1rem' }} />
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', marginBottom: '0.5rem' }}>
          Order Confirmed
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
          Thank you for choosing AXI Collection. Your Cash on Delivery order has been logged.
        </p>
      </div>

      <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)', padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Order Reference</span>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: 'var(--text-primary)', marginTop: '2px' }}>
              {orderId || 'ORD-2026-X89A2'}
            </h3>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Payment Mode</span>
            <h4 style={{ fontSize: '1.1rem', marginTop: '2px' }}>Cash on Delivery</h4>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Status</span>
            <div><span className="badge badge-warning" style={{ marginTop: '4px' }}>{order?.status || 'Pending'}</span></div>
          </div>
        </div>

        {order && (
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Ordered Items
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'} alt={item.name} style={{ width: '40px', height: '50px', objectFit: 'cover' }} />
                    <span>{item.name} &times; {item.quantity}</span>
                  </div>
                  <strong>PKR {(item.price * item.quantity).toLocaleString()}</strong>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700 }}>
              <span>Total Payable upon Delivery</span>
              <span>PKR {order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to={`/track-order?orderId=${orderId}`} className="btn btn-primary">
          Track Order Status <ArrowRight size={16} />
        </Link>
        <Link to="/products" className="btn btn-secondary">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
