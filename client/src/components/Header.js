import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="brand">
          <h1>🌊 TürkiyeAI</h1>
          <p>Powered by OrkinosAI</p>
        </div>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/destinations">Destinations</Link>
          <Link to="/chat">AI Travel Agent</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
