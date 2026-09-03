import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';
import CourierModal from '../components/admin/CourierModal';
import { Truck, Eye, CheckCircle2, Filter, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');

  // Selected Order for Modal / Status edit
  const [selectedOrderForCourier, setSelectedOrderForCourier] = useState(null);
  const [viewOrderDetails, setViewOrderDetails] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/orders?status=${statusFilter}`);
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      if (res.success) {
        setNotification(`Order status updated to ${newStatus}`);
        fetchOrders();
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>ADMINISTRATION</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginTop: '2px' }}>Order Workflow Management</h1>
          </div>

          {/* Status Filter Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Filter Status:</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {notification && (
          <div style={{ backgroundColor: '#e6f4ea', color: '#137333', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontWeight: 600 }}>
            {notification}
          </div>
        )}

        {/* Orders Table */}
        <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-subtle)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
              <div className="spinner"></div>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No orders found matching the filter "{statusFilter}".
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order Reference</th>
                    <th>Customer Name</th>
                    <th>Destination</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Courier Tracking</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{ord.orderId}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ord.shippingAddress?.fullName || 'Customer'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.customerEmail}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{ord.shippingAddress?.city}</td>
                      <td style={{ fontWeight: 700 }}>PKR {ord.totalAmount.toLocaleString()}</td>
                      <td>
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateStatus(ord._id, e.target.value)}
                          className="form-select"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        {ord.courierInfo && ord.courierInfo.trackingId ? (
                          <div style={{ fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: 700 }}>{ord.courierInfo.carrier}:</span><br />
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{ord.courierInfo.trackingId}</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setSelectedOrderForCourier(ord)}
                            className="btn btn-accent btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                          >
                            <Truck size={12} /> Assign Tracking ID
                          </button>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button 
                            onClick={() => setViewOrderDetails(ord)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.5rem' }}
                            title="View Full Order Info"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => setSelectedOrderForCourier(ord)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.3rem 0.5rem' }}
                            title="Edit Courier Info"
                          >
                            <Truck size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Courier Tracking Modal */}
      {selectedOrderForCourier && (
        <CourierModal
          order={selectedOrderForCourier}
          onClose={() => setSelectedOrderForCourier(null)}
          onSuccess={(msg) => {
            setNotification(msg);
            fetchOrders();
            setTimeout(() => setNotification(''), 4000);
          }}
        />
      )}

      {/* Order Detail Modal */}
      {viewOrderDetails && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: 'var(--shadow-dropdown)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>Order Details</h3>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{viewOrderDetails.orderId}</span>
              </div>
              <button onClick={() => setViewOrderDetails(null)} className="btn btn-secondary btn-sm">Close</button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Shipping Address</h4>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                <strong>{viewOrderDetails.shippingAddress.fullName}</strong><br />
                Phone: {viewOrderDetails.shippingAddress.phone}<br />
                Street: {viewOrderDetails.shippingAddress.street}<br />
                City: {viewOrderDetails.shippingAddress.city}, {viewOrderDetails.shippingAddress.postalCode}<br />
                Country: {viewOrderDetails.shippingAddress.country}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ordered Items</h4>
              {viewOrderDetails.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                  <span>{item.name} &times; {item.quantity}</span>
                  <strong>PKR {(item.price * item.quantity).toLocaleString()}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, paddingTop: '1rem', borderTop: '1px solid #000' }}>
              <span>Total COD Amount</span>
              <span>PKR {viewOrderDetails.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
