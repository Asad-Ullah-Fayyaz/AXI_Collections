import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('axi_token') || null);
  const [loading, setLoading] = useState(true);

  // Fetch current user details on mount if token exists
  useEffect(() => {
    let ignore = false;

    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (!ignore && res.success) {
          setUser(res.user);
        }
      } catch (err) {
        // Guarded by `ignore`: without it, a rejection belonging to a previous token
        // can land after a newer sign-in has already stored its token and wipe it —
        // which reads to the user as "the admin login silently did nothing".
        if (!ignore) {
          console.error('Failed to load user session:', err.message);
          localStorage.removeItem('axi_token');
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadUser();

    return () => {
      ignore = true;
    };
  }, [token]);

  // Keep every open tab on a single identity. services/api.js reads 'axi_token' out
  // of localStorage on each request, so signing in from another tab immediately
  // changes which account THIS tab's requests act as. Without this listener the tab
  // would keep rendering the previous user while writing orders and cart items under
  // the new one. The 'storage' event only fires in other tabs, never the one that
  // made the change, so this cannot fight the setters above.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== 'axi_token') return;
      // Clear the user eagerly on sign-out: the [token] effect early-returns when
      // there is no token and would otherwise leave the old profile on screen.
      if (!event.newValue) setUser(null);
      setToken(event.newValue);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success) {
      localStorage.setItem('axi_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  // Separate endpoint, same resulting session. The backend rejects non-admin
  // accounts here; it does NOT grant this token any extra authority, so nothing
  // downstream should treat a session created this way as more privileged than one
  // created by login() — middleware/auth.js re-checks the role from the database on
  // every request either way.
  const adminLogin = async (email, password) => {
    const res = await api.post('/auth/admin-login', { email, password });
    if (res.success) {
      localStorage.setItem('axi_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.success) {
      localStorage.setItem('axi_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('axi_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.success) {
      setUser(res.user);
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        adminLogin,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
