import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/profile';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(redirectPath);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '5rem 1.5rem', maxWidth: '480px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="text-uppercase-tracking" style={{ color: 'var(--text-muted)' }}>CLIENT PORTAL</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginTop: '0.25rem' }}>Sign In to AXI</h1>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#fce8e6', color: '#c5221f', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="form-input" 
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label">Password</label>
          </div>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="form-input" 
            placeholder="Enter your password"
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: '1.5rem', padding: '0.9rem' }}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Don't have an account yet? <Link to="/register" style={{ fontWeight: 600, textDecoration: 'underline', color: '#000' }}>Register Account</Link>
      </div>
    </div>
  );
}
