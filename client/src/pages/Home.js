import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdBanner from '../components/AdBanner';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      {/* Top billboard ad – above hero */}
      <AdBanner zone="home_top" style={{ marginBottom: '1.5rem' }} />

      <div className="hero">
        <h1>🇹🇷 Welcome to TurkiyAI Holidays</h1>
        <p>AI Knows Turkey Better</p>
        <p style={{ fontSize: '1rem', color: 'var(--warm-slate-500)', marginBottom: '3rem' }}>
          Discover the beauty of Turkey with AI-powered travel recommendations
        </p>
        
        <div className="hero-buttons">
          <button className="btn btn-primary" onClick={() => navigate('/trip-planner')}>
            📋 Plan Your Trip
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}>
            🤖 Chat with AI Agent
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/destinations')}>
            🗺️ Explore Destinations
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/services')}>
            🌍 Travel Services
          </button>
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--aegean-blue)', marginBottom: '2rem' }}>
          About TurkiyAI Holidays
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ color: 'var(--azure-turquoise)', marginBottom: '1rem' }}>🧠 AI-Powered</h3>
            <p style={{ color: 'var(--warm-slate-700)' }}>
              Conversational AI travel agent built on Azure AI and Azure OpenAI for 
              intelligent travel recommendations and planning.
            </p>
          </div>
          
          <div className="card">
            <h3 style={{ color: 'var(--azure-turquoise)', marginBottom: '1rem' }}>🏖️ Turkish Destinations</h3>
            <p style={{ color: 'var(--warm-slate-700)' }}>
              Expert knowledge of Bodrum, Marmaris, Fethiye, Antalya, Cappadocia, 
              and more stunning Turkish locations.
            </p>
          </div>
          
          <div className="card">
            <h3 style={{ color: 'var(--azure-turquoise)', marginBottom: '1rem' }}>🔍 Semantic Search</h3>
            <p style={{ color: 'var(--warm-slate-700)' }}>
              Advanced Azure AI Search for finding the perfect destination, 
              hotel, or experience based on your preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Resort Deep Dive & Proximity AI */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>
          🏨 Resort Intelligence
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--warm-slate-500)', marginBottom: '2rem' }}>
          Deep AI-powered resort profiles with proximity learning
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem' }}>🔬 Resort Deep Dive</h3>
            <p style={{ color: 'var(--warm-slate-700)' }}>
              Comprehensive AI-generated resort profiles including amenity breakdowns, 
              AI travel insights, and distance to beaches, airports, and cultural sites.
            </p>
          </div>
          <div className="card">
            <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem' }}>📡 Hotel Proximity AI</h3>
            <p style={{ color: 'var(--warm-slate-700)' }}>
              AI learns which hotels are nearest to key attractions. Find alternatives, 
              discover similar hotels, and understand location advantages at a glance.
            </p>
          </div>
          <div className="card">
            <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem' }}>⭐ Proximity Scores</h3>
            <p style={{ color: 'var(--warm-slate-700)' }}>
              Each resort receives proximity scores for beaches, airports, cultural sites, 
              and marinas – so you can compare location quality instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Mid-page ad banner between sections */}
      <AdBanner zone="home_mid" style={{ marginTop: '1.5rem' }} />

      {/* Service Verticals */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>
          🌍 Travel Service Verticals
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--warm-slate-500)', marginBottom: '2rem' }}>
          Everything you need for your perfect Turkish holiday
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {[
            { icon: '🏨', label: 'Hotels & Resorts', desc: 'Luxury & boutique hotels across Turkey' },
            { icon: '🗺️', label: 'Excursions', desc: 'Day trips, tours & authentic experiences' },
            { icon: '🚗', label: 'Transfers', desc: 'Private & shared airport transfers' },
            { icon: '🎒', label: 'Packages', desc: 'All-inclusive & tailor-made holidays' },
            { icon: '✈️', label: 'Flights', desc: 'Airport info & UK route guidance' },
          ].map(v => (
            <div
              key={v.label}
              className="card"
              style={{ cursor: 'pointer', textAlign: 'center' }}
              onClick={() => navigate('/services')}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{v.icon}</div>
              <h4 style={{ color: 'var(--aegean-blue)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>{v.label}</h4>
              <p style={{ color: 'var(--warm-slate-700)', fontSize: '0.82rem', margin: 0 }}>{v.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/services')}>
            Browse All Services →
          </button>
        </div>
      </div>

      <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--soft-beige)', borderRadius: '12px' }}>
        <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem' }}>ℹ️ What We Are</h3>
        <ul style={{ lineHeight: '2', color: 'var(--warm-slate-700)' }}>
          <li>✅ AI-powered travel discovery & planning platform</li>
          <li>✅ SaaS AI travel agent for Turkish destinations</li>
          <li>✅ Resort deep dive & hotel proximity AI learning</li>
          <li>✅ Travel service verticals – hotels, excursions, transfers, packages</li>
          <li>✅ Intelligent recommendations and itinerary building</li>
        </ul>
        
        <h3 style={{ color: 'var(--bougainvillea-pink)', marginTop: '2rem', marginBottom: '1rem' }}>🚫 What We Are NOT</h3>
        <ul style={{ lineHeight: '2', color: 'var(--warm-slate-700)' }}>
          <li>❌ Not a tour operator or travel agency</li>
          <li>❌ We do not take payments or issue tickets</li>
          <li>❌ Bookings are redirected to licensed providers</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--warm-slate-500)', fontSize: '0.9rem' }}>
        <p>
          <strong>Brand Story:</strong> Orkinos means "tuna" in Turkish – symbolising intelligence, 
          speed, and navigation. Built on Microsoft Azure, inspired by azure/Aegean waves. 
          TurkiyAI Holidays represents intelligent navigation through Turkish travel using AI.
        </p>
      </div>

      {/* Bottom banner ad */}
      <AdBanner zone="home_bottom" style={{ marginTop: '1.5rem' }} />
    </div>
  );
}

export default Home;
