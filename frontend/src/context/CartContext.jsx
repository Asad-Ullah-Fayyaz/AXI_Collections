import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load cart whenever authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Local storage fallback for unauthenticated browsing
      const localCart = JSON.parse(localStorage.getItem('axi_local_cart') || '{"items":[]}');
      calculateLocalCart(localCart.items);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.success) {
        setCart(res.cart);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalCart = (items) => {
    const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
    const subtotal = items.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
    setCart({ items, itemCount, subtotal });
    localStorage.setItem('axi_local_cart', JSON.stringify({ items }));
  };

  const addToCart = async (product, quantity = 1) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await api.post('/cart/add', { productId: product._id, quantity });
        if (res.success) {
          setCart(res.cart);
          setIsCartOpen(true);
        }
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // Local cart addition
      const currentItems = [...cart.items];
      const existingIdx = currentItems.findIndex(i => i.product._id === product._id);
      if (existingIdx > -1) {
        currentItems[existingIdx].quantity += quantity;
      } else {
        currentItems.push({ product, quantity, itemTotal: product.price * quantity });
      }
      calculateLocalCart(currentItems);
      setIsCartOpen(true);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (isAuthenticated) {
      try {
        const res = await api.put('/cart/update', { productId, quantity });
        if (res.success) {
          setCart(res.cart);
        }
      } catch (err) {
        throw err;
      }
    } else {
      const currentItems = cart.items.map(i => {
        if (i.product._id === productId) {
          return { ...i, quantity, itemTotal: i.product.price * quantity };
        }
        return i;
      }).filter(i => i.quantity > 0);
      calculateLocalCart(currentItems);
    }
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        const res = await api.delete(`/cart/item/${productId}`);
        if (res.success) {
          setCart(res.cart);
        }
      } catch (err) {
        console.error(err.message);
      }
    } else {
      const currentItems = cart.items.filter(i => i.product._id !== productId);
      calculateLocalCart(currentItems);
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.delete('/cart/clear');
      } catch (err) {
        console.error(err.message);
      }
    }
    setCart({ items: [], itemCount: 0, subtotal: 0 });
    localStorage.removeItem('axi_local_cart');
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
