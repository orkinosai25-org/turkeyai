import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('turkiyeai_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {
        localStorage.removeItem('turkiyeai_user');
        localStorage.removeItem('turkiyeai_token');
      }
    }
  }, []);

  function handleSignOut() {
    localStorage.removeItem('turkiyeai_token');
    localStorage.removeItem('turkiyeai_user');
    setUser(null);
    navigate('/');
  }

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="brand-link">
          <div className="brand">
            <div className="brand-logo">
              <img 
                src="/logo-mark.svg" 
                alt="TurkiyAI Holidays Logo" 
                className="logo-icon"
                style={{ width: '40px', height: '40px' }}
              />
              <div className="brand-text">
                <h1>TurkiyAI Holidays</h1>
                <p className="brand-tagline">AI Knows Turkey Better</p>
              </div>
            </div>
            <p className="brand-powered">Powered by OrkinosAI</p>
          </div>
        </Link>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/search">Search</Link>
          <Link to="/destinations">Destinations</Link>
          <Link to="/services">Services</Link>
          <Link to="/trip-planner">Trip Planner</Link>
          <Link to="/chat">AI Travel Agent</Link>
          <Link to="/knowledge">Knowledge</Link>
          <Link to="/admin/ads">Ads</Link>
        </nav>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginLeft: '1rem' }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.85rem', color: 'var(--warm-slate-700)', fontWeight: 500 }}>
                👋 {user.first_name}
              </span>
              <button
                onClick={handleSignOut}
                style={{ padding: '0.4rem 0.9rem', background: 'transparent', border: '1.5px solid var(--aegean-blue)', borderRadius: '6px', color: 'var(--aegean-blue)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{ padding: '0.4rem 0.9rem', background: 'transparent', border: '1.5px solid var(--aegean-blue)', borderRadius: '6px', color: 'var(--aegean-blue)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                style={{ padding: '0.4rem 0.9rem', background: 'var(--aegean-blue)', borderRadius: '6px', color: 'white', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
