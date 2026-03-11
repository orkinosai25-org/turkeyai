import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HighlightCarousel from '../components/HighlightCarousel';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Destinations() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDestinations();
    fetchResorts();
  }, []);

  const fetchDestinations = async () => {
    try {
      const response = await axios.get('/api/destinations');
      setDestinations(response.data.destinations || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load destinations');
      setLoading(false);
      console.error('Error fetching destinations:', err);
    }
  };

  const fetchResorts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/resorts`);
      setResorts(response.data.resorts || []);
    } catch {
      // Non-critical
    }
  };

  if (loading) {
    return (
      <div className="page">
        <h2>Loading destinations...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h2 style={{ color: 'red' }}>{error}</h2>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem' }}>
        Explore Turkish Destinations
      </h1>
      <p style={{ color: 'var(--warm-slate-500)', marginBottom: '2rem' }}>
        Discover the most beautiful places in Turkey
      </p>

      <div className="destinations-grid">
        {destinations.map((destination) => (
          <div key={destination.id} className="card">
            <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>
              {destination.name}
            </h3>
            <p style={{ 
              color: 'var(--warm-slate-500)', 
              fontSize: '0.9rem', 
              marginBottom: '1rem',
              fontStyle: 'italic' 
            }}>
              {destination.region}
            </p>
            <p style={{ marginBottom: '1rem', color: 'var(--warm-slate-700)' }}>
              {destination.description}
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--azure-turquoise)', display: 'block', marginBottom: '0.5rem' }}>Highlights:</strong>
              <HighlightCarousel highlights={destination.highlights} />
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              color: 'var(--warm-slate-500)',
              marginBottom: '1rem',
            }}>
              <span>📅 {destination.bestTime}</span>
              <span>🏷️ {destination.type}</span>
            </div>

            <button
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', width: '100%' }}
              onClick={() => navigate('/services')}
            >
              🗺️ Excursions & Packages
            </button>
          </div>
        ))}
      </div>

      {/* Resort Listings with Deep Dive */}
      {resorts.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>🏨 Featured Hotels & Resorts</h2>
          <p style={{ color: 'var(--warm-slate-500)', marginBottom: '1.5rem' }}>
            Tap any resort for an AI Deep Dive – proximity scores, amenities & travel insights
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {resorts.map(resort => (
              <div
                key={resort.id}
                className="card"
                style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onClick={() => navigate(`/resorts/${resort.id}/deep-dive`)}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ color: 'var(--aegean-blue)', fontSize: '1rem', margin: 0, flex: 1 }}>{resort.name}</h3>
                  <span style={{ color: '#f59e0b', fontSize: '0.9rem', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                    {'⭐'.repeat(resort.star_rating || 0)}
                  </span>
                </div>
                <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.82rem', margin: '0 0 0.5rem' }}>
                  📍 {resort.destination_name || resort.destination_region}
                </p>
                {resort.description && (
                  <p style={{ color: 'var(--warm-slate-700)', fontSize: '0.875rem', margin: '0 0 0.75rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {resort.description}
                  </p>
                )}
                {resort.price_range && (
                  <span style={{ color: 'var(--aegean-blue)', fontWeight: 700, fontSize: '0.85rem' }}>{resort.price_range}</span>
                )}
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--azure-turquoise)', fontSize: '0.82rem' }}>
                  <span>🔬</span>
                  <span>View AI Deep Dive →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Destinations;
