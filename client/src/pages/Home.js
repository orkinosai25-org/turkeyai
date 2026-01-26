import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="hero">
        <h1>🇹🇷 Welcome to TürkiyeAI</h1>
        <p>Your AI Travel Expert for Türkiye</p>
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
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--aegean-blue)', marginBottom: '2rem' }}>
          About TürkiyeAI
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

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--soft-beige)', borderRadius: '12px' }}>
          <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem' }}>ℹ️ What We Are</h3>
          <ul style={{ lineHeight: '2', color: 'var(--warm-slate-700)' }}>
            <li>✅ AI-powered travel discovery & planning platform</li>
            <li>✅ SaaS AI travel agent for Turkish destinations</li>
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
            <strong>Brand Story:</strong> Orkinos means "tuna" in Turkish – symbolizing intelligence, 
            speed, and navigation. Built on Microsoft Azure, inspired by azure/Aegean waves. 
            TürkiyeAI represents intelligent navigation through Turkish travel using AI.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
