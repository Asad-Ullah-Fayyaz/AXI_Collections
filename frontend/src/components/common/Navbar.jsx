import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import logo from '../../images/logo.png'  

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart, setIsCartOpen } = useCart();
  const [categories, setCategories] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryDropdown, setActiveCategoryDropdown] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.success) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error('Error loading navbar categories:', err.message);
      }
    };
    fetchCategories();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, backgroundColor: '#fff', borderBottom: '1px solid var(--border-light)' }}>
      {/* Top Announcement Bar */}
      <div style={{ backgroundColor: 'var(--bg-dark)', color: '#fff', padding: '0.4rem 1rem', fontSize: '0.7rem', textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Complimentary Shipping Over PKR 20,000 &bull; Cash On Delivery Available Nationwide
      </div>

      {/* Main Navigation Header */}
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px' }}>
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ display: 'none', padding: '0.5rem' }} 
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Brand Logo */}
       <Link to="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
  <img 
    src={logo} 
    alt="logo" 
    className="logo-image"
    style={{
      height: '70px',
      width: 'auto',
      objectFit: 'contain'
    }} 
  />
</Link>

        {/* Desktop Category Navigation Bar */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <Link to="/products" style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Shop All
          </Link>

          {categories.map((cat) => (
            <div 
              key={cat._id}
              style={{ position: 'relative', height: '80px', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => setActiveCategoryDropdown(cat._id)}
              onMouseLeave={() => setActiveCategoryDropdown(null)}
            >
              <Link 
                to={`/products?category=${cat.slug}`}
                style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {cat.name}
                {cat.subCategories && cat.subCategories.length > 0 && <ChevronDown size={14} />}
              </Link>

              {/* SubCategory Dropdown */}
              {activeCategoryDropdown === cat._id && cat.subCategories && cat.subCategories.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '80px',
                  left: '0',
                  minWidth: '220px',
                  backgroundColor: '#fff',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-dropdown)',
                  padding: '1rem 0',
                  zIndex: 1100
                }}>
                  {cat.subCategories.map((sub) => (
                    <Link
                      key={sub._id}
                      to={`/products?category=${cat.slug}&subCategory=${sub.slug}`}
                      style={{
                        display: 'block',
                        padding: '0.6rem 1.5rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}
                      onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--bg-secondary)'; e.target.style.color = '#000'; }}
                      onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Link to="/track-order" style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Track Order
          </Link>
        </nav>

        {/* Action Icons (Search, User, Cart) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)} 
            style={{ color: 'var(--text-primary)', padding: '0.25rem' }}
            aria-label="Search Catalog"
          >
            <Search size={20} />
          </button>

          {/* User Account Menu */}
          <div style={{ position: 'relative' }} className="user-dropdown-container">
            <Link to={isAuthenticated ? (isAdmin ? "/admin" : "/profile") : "/login"} style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={20} />
            </Link>
          </div>

          {/* Cart Drawer Trigger Button */}
          <button 
            onClick={() => setIsCartOpen(true)}
            style={{ position: 'relative', color: 'var(--text-primary)', padding: '0.25rem' }}
            aria-label="Open Shopping Bag"
          >
            <ShoppingBag size={20} />
            {cart.itemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                backgroundColor: 'var(--bg-dark)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cart.itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Search Drawer */}
      {isSearchOpen && (
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', padding: '1.25rem 0' }}>
          <div className="container">
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search watches, sunglasses, mobile accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid var(--border-light)', outline: 'none' }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary">Search</button>
              <button type="button" onClick={() => setIsSearchOpen(false)} style={{ padding: '0.5rem' }}>
                <X size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '110px',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#fff',
          zIndex: 999,
          padding: '2rem 1.5rem',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Shop All
            </Link>
            {categories.map((cat) => (
              <div key={cat._id}>
                <Link to={`/products?category=${cat.slug}`} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  {cat.name}
                </Link>
                {cat.subCategories && cat.subCategories.length > 0 && (
                  <div style={{ paddingLeft: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {cat.subCategories.map((sub) => (
                      <Link 
                        key={sub._id} 
                        to={`/products?category=${cat.slug}&subCategory=${sub.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <hr style={{ borderColor: 'var(--border-light)' }} />
            <Link to="/track-order" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
              Track Order
            </Link>
            {isAuthenticated ? (
              <>
                <Link to={isAdmin ? "/admin" : "/profile"} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                  {isAdmin ? 'Admin Dashboard' : 'My Account & Orders'}
                </Link>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} style={{ textAlign: 'left', fontSize: '1rem', color: 'red' }}>
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}
