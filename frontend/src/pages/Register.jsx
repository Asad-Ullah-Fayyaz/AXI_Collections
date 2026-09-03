import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await register(name, email, password);
      if (res.success) {
        navigate('/profile');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '5rem 1.5rem', maxWidth: '480px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="text-uppercase-tracking" style={{ color: 'var(--text-muted)' }}>NEW CLIENT</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginTop: '0.25rem' }}>Create Account</h1>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#fce8e6', color: '#c5221f', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            className="form-input" 
            placeholder="e.g. Alexander Wright"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="form-input" 
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password *</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="form-input" 
            placeholder="At least 6 characters"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Password *</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            className="form-input" 
            placeholder="Repeat password"
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: '1.5rem', padding: '0.9rem' }}>
          {loading ? 'Creating Account...' : 'Register Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Already registered? <Link to="/login" style={{ fontWeight: 600, textDecoration: 'underline', color: '#000' }}>Sign In</Link>
      </div>
    </div>
  );
}
