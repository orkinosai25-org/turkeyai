import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-brand">
            <h3>🌊 TürkiyeAI</h3>
            <p className="footer-tagline">Your AI Travel Expert for Türkiye</p>
            <p className="footer-powered">Powered by OrkinosAI</p>
          </div>
        </div>
        
        <div className="footer-section">
          <h4>About</h4>
          <p className="footer-text">
            TürkiyeAI is an AI-powered travel discovery platform by OrkinosAI Ltd.
          </p>
        </div>
        
        <div className="footer-section">
          <h4>Navigation</h4>
          <nav className="footer-nav">
            <a href="/">Home</a>
            <a href="/destinations">Destinations</a>
            <a href="/chat">AI Travel Agent</a>
          </nav>
        </div>
        
        <div className="footer-section">
          <h4>Legal</h4>
          <p className="footer-disclaimer">
            TürkiyeAI is an AI-powered travel discovery platform by OrkinosAI Ltd.
            We do not sell travel products directly. Bookings are completed with 
            licensed third-party providers.
          </p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 OrkinosAI Ltd. All rights reserved.</p>
        <p>Built on Microsoft Azure</p>
      </div>
    </footer>
  );
}

export default Footer;
