import React from 'react';
import AdBanner from './AdBanner';

function Footer() {
  return (
    <>
      {/* Footer ad banner – rendered above the footer */}
      <AdBanner zone="footer_banner" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }} label={true} />
      <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-brand">
            <img 
              src="/logo-mark.svg" 
              alt="TurkiyAI Holidays" 
              style={{ width: '40px', height: '40px', marginBottom: '0.5rem' }}
            />
            <h3>TurkiyAI Holidays</h3>
            <p className="footer-tagline">AI Knows Turkey Better</p>
            <img 
              src="/powered-by-orkinosai.svg" 
              alt="Powered by OrkinosAI" 
              style={{ width: '150px', marginTop: '1rem' }}
            />
          </div>
        </div>
        
        <div className="footer-section">
          <h4>About</h4>
          <p className="footer-text">
            TurkiyAI Holidays is an AI-powered travel discovery platform by OrkinosAI Ltd.
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
            TurkiyAI Holidays is an AI-powered travel discovery platform by OrkinosAI Ltd.
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
    </>
  );
}

export default Footer;
