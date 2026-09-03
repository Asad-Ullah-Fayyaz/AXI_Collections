import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Protected Route for Admin Users
const RequireAdmin = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}><div className="spinner"></div></div>;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/login" replace />;
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

                {/* Protected Admin Console Routes */}
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
