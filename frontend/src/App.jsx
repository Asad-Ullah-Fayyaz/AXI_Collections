import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/common/CartDrawer';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import TrackOrder from './pages/TrackOrder';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminProducts from './pages/AdminProducts';
import AdminProductEdit from './pages/AdminProductEdit';
import AdminCategories from './pages/AdminCategories';
import AdminCustomers from './pages/AdminCustomers';

// Protected Route for Authenticated Customers
const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}><div className="spinner"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Shown to a signed-in customer who reaches an /admin URL.
//
// Deliberately honest rather than a fake 404. Faking one would not hide anything:
// every admin path is already in the production JS bundle, an anonymous visitor is
// sent to a working /admin/login either way, and — because the catch-all below
// REDIRECTS to / — a 404 rendered in place at /admin/orders would look nothing like
// a genuinely unknown URL, so the disguise would advertise the very route it was
// meant to conceal.
const NoAccess = () => (
  <div className="container" style={{ padding: '6rem 1.5rem', maxWidth: '520px', textAlign: 'center' }}>
    <span className="text-uppercase-tracking" style={{ color: 'var(--text-muted)' }}>RESTRICTED</span>
    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginTop: '0.25rem' }}>No access to this area</h1>
    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.9rem', lineHeight: 1.7 }}>
      This section is limited to store administrators. If you believe you should have
      access, please contact the store owner.
    </p>
    <Link to="/" className="btn btn-primary" style={{ marginTop: '2rem' }}>Return to Store</Link>
  </div>
);

// Protected Route for Admin Users
const RequireAdmin = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}><div className="spinner"></div></div>;
  // Not signed in at all → the admin door, not the customer one. Sending an
  // administrator to /login used to strand them: that page no longer routes admins
  // anywhere near the console.
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <NoAccess />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <CartDrawer />

            <div style={{ flex: 1 }}>
              <Routes>
                {/* Public Storefront Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Customer Account Routes */}
                <Route path="/profile" element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                } />

                {/* Admin console. Unlinked from the storefront by design; the
                    backend, not the URL, is what actually enforces access. */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={
                  <RequireAdmin>
                    <AdminDashboard />
                  </RequireAdmin>
                } />
                <Route path="/admin/orders" element={
                  <RequireAdmin>
                    <AdminOrders />
                  </RequireAdmin>
                } />
                <Route path="/admin/products" element={
                  <RequireAdmin>
                    <AdminProducts />
                  </RequireAdmin>
                } />
                <Route path="/admin/products/new" element={
                  <RequireAdmin>
                    <AdminProductEdit />
                  </RequireAdmin>
                } />
                <Route path="/admin/products/edit/:id" element={
                  <RequireAdmin>
                    <AdminProductEdit />
                  </RequireAdmin>
                } />
                <Route path="/admin/categories" element={
                  <RequireAdmin>
                    <AdminCategories />
                  </RequireAdmin>
                } />
                <Route path="/admin/customers" element={
                  <RequireAdmin>
                    <AdminCustomers />
                  </RequireAdmin>
                } />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>

            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
