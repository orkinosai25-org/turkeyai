import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="brand-link">
          <div className="brand">
            <div className="brand-logo">
              <img 
                src="/logo-mark.svg" 
                alt="TürkiyeAI Logo" 
                className="logo-icon"
                style={{ width: '40px', height: '40px' }}
              />
              <div className="brand-text">
                <h1>TürkiyeAI</h1>
                <p className="brand-tagline">Your AI Travel Expert for Türkiye</p>
              </div>
            </div>
            <p className="brand-powered">Powered by OrkinosAI</p>
          </div>
        </Link>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/destinations">Destinations</Link>
          <Link to="/services">Services</Link>
          <Link to="/trip-planner">Trip Planner</Link>
          <Link to="/chat">AI Travel Agent</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
