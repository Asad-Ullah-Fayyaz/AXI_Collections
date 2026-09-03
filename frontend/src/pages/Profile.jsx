import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Package, MapPin, LogOut, ArrowRight, Truck } from 'lucide-react';
import api from '../services/api';

export default function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Address Form State
  const [street, setStreet] = useState(user?.addresses?.[0]?.street || '');
  const [city, setCity] = useState(user?.addresses?.[0]?.city || '');
  const [phone, setPhone] = useState(user?.addresses?.[0]?.phone || '');
  const [postalCode, setPostalCode] = useState(user?.addresses?.[0]?.postalCode || '');

  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMsg, setAddressMsg] = useState('');

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        if (res.success) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.error('Failed to load my orders:', err.message);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchMyOrders();
  }, []);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    setAddressMsg('');

    try {
      const updatedAddresses = [{
        fullName: user.name,
        phone,
        street,
        city,
        postalCode,
        country: 'Pakistan',
        isDefault: true
      }];

      await updateProfile({ addresses: updatedAddresses });
      setAddressMsg('Address saved successfully');
      setTimeout(() => setAddressMsg(''), 3000);
    } catch (err) {
      setAddressMsg('Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>CLIENT ACCOUNT</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginTop: '2px' }}>
            Welcome, {user.name}
          </h1>
        </div>

        <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-secondary btn-sm" style={{ color: 'red', borderColor: '#ffcccc' }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '3rem', alignItems: 'start' }}>
        {/* Left Address & Profile Settings */}
        <aside style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.75rem', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} /> Delivery Address
          </h3>

          {addressMsg && (
            <div style={{ fontSize: '0.8rem', color: '#137333', marginBottom: '1rem', fontWeight: 600 }}>
              {addressMsg}
            </div>
          )}

          <form onSubmit={handleSaveAddress}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="form-input" 
                placeholder="e.g. 0300 1234567"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input 
                type="text" 
                value={street} 
                onChange={(e) => setStreet(e.target.value)} 
                className="form-input" 
                placeholder="House / Street"
              />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input 
                type="text" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                className="form-input" 
                placeholder="City"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Postal Code</label>
              <input 
                type="text" 
                value={postalCode} 
                onChange={(e) => setPostalCode(e.target.value)} 
                className="form-input" 
                placeholder="Postal Code"
              />
            </div>
            <button type="submit" disabled={savingAddress} className="btn btn-primary btn-sm btn-full">
              {savingAddress ? 'Saving...' : 'Save Default Address'}
            </button>
          </form>
        </aside>

        {/* Right Order History Table */}
        <main>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} /> Purchase & Order History
          </h3>

          {loadingOrders ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div className="spinner"></div>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', backgroundColor: 'var(--bg-secondary)', textAlignment: 'center', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You have not placed any orders yet.</p>
              <Link to="/products" className="btn btn-primary btn-sm">Start Browsing Catalog</Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{ord.orderId}</td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(ord.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontSize: '0.85rem' }}>{ord.items.length} item(s)</td>
                      <td style={{ fontWeight: 700 }}>PKR {ord.totalAmount.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${ord.status === 'Delivered' ? 'badge-success' : (ord.status === 'Shipped' ? 'badge-info' : 'badge-warning')}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/track-order?orderId=${ord.orderId}`} style={{ fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Truck size={14} /> Track
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

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
