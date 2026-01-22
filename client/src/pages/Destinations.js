import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Destinations() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDestinations();
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
              <strong style={{ color: 'var(--azure-turquoise)' }}>Highlights:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: 'var(--warm-slate-700)' }}>
                {destination.highlights.map((highlight, idx) => (
                  <li key={idx}>{highlight}</li>
                ))}
              </ul>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              color: 'var(--warm-slate-500)'
            }}>
              <span>📅 {destination.bestTime}</span>
              <span>🏷️ {destination.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Destinations;
