import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DEFAULT_DAYS = 2;
const MIN_DAYS = 1;
const MAX_DAYS = 30;

function TripPlanner() {
  const [destinations, setDestinations] = useState([]);
  const [tripItems, setTripItems] = useState([]);
  const [tripName, setTripName] = useState('My Turkish Adventure');
  const [tripDates, setTripDates] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [notes, setNotes] = useState('');

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

  const addToTrip = () => {
    if (!selectedDestination) return;

    const destinationId = parseInt(selectedDestination);
    if (isNaN(destinationId)) return;

    const destination = destinations.find(d => d.id === destinationId);
    if (destination && !tripItems.find(item => item.id === destination.id)) {
      setTripItems([...tripItems, {
        id: destination.id,
        name: destination.name,
        region: destination.region,
        type: destination.type,
        days: DEFAULT_DAYS
      }]);
      setSelectedDestination('');
    }
  };

  const removeFromTrip = (id) => {
    setTripItems(tripItems.filter(item => item.id !== id));
  };

  const updateDays = (id, days) => {
    const parsedDays = parseInt(days);
    const validDays = isNaN(parsedDays) ? MIN_DAYS : Math.min(Math.max(parsedDays, MIN_DAYS), MAX_DAYS);
    setTripItems(tripItems.map(item => 
      item.id === id ? { ...item, days: validDays } : item
    ));
  };

  const getTotalDays = () => {
    return tripItems.reduce((total, item) => total + item.days, 0);
  };

  const clearTrip = () => {
    setTripItems([]);
    setTripName('My Turkish Adventure');
    setTripDates({ start: '', end: '' });
    setNotes('');
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
        📋 Trip Planner
      </h1>
      <p style={{ color: 'var(--warm-slate-500)', marginBottom: '2rem' }}>
        Plan your perfect Turkish vacation itinerary
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Left Column - Trip Details */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem' }}>Trip Details</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--warm-slate-700)', fontWeight: 600 }}>
                Trip Name
              </label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid var(--warm-slate-300)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--warm-slate-700)', fontWeight: 600 }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={tripDates.start}
                  onChange={(e) => setTripDates({ ...tripDates, start: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid var(--warm-slate-300)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--warm-slate-700)', fontWeight: 600 }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={tripDates.end}
                  onChange={(e) => setTripDates({ ...tripDates, end: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid var(--warm-slate-300)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--warm-slate-700)', fontWeight: 600 }}>
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special notes or preferences..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid var(--warm-slate-300)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          <div className="card">
            <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem' }}>Add Destination</h3>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '2px solid var(--warm-slate-300)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select a destination...</option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name} ({dest.region})
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={addToTrip}
                disabled={!selectedDestination}
                style={{ whiteSpace: 'nowrap' }}
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Itinerary */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'var(--aegean-blue)', margin: 0 }}>Your Itinerary</h3>
              {tripItems.length > 0 && (
                <button
                  onClick={clearTrip}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: '1px solid var(--bougainvillea-pink)',
                    borderRadius: '6px',
                    color: 'var(--bougainvillea-pink)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            {tripItems.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem 1rem',
                color: 'var(--warm-slate-500)',
                background: 'var(--limestone-white)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                <p>No destinations added yet</p>
                <p style={{ fontSize: '0.85rem' }}>Select destinations from the left to build your itinerary</p>
              </div>
            ) : (
              <>
                {tripItems.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--limestone-white)',
                      padding: '1rem',
                      borderRadius: '8px',
                      marginBottom: '0.75rem',
                      border: '2px solid var(--warm-slate-200)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ 
                            background: 'var(--aegean-blue)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            {index + 1}
                          </span>
                          <strong style={{ color: 'var(--aegean-blue)' }}>{item.name}</strong>
                        </div>
                        <p style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--warm-slate-500)',
                          margin: '0 0 0 32px'
                        }}>
                          {item.region} • {item.type}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromTrip(item.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--bougainvillea-pink)',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: '0 0.25rem'
                        }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '32px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--warm-slate-700)' }}>
                        Duration:
                      </label>
                      <input
                        type="number"
                        min={MIN_DAYS}
                        max={MAX_DAYS}
                        value={item.days}
                        onChange={(e) => updateDays(item.id, e.target.value)}
                        style={{
                          width: '60px',
                          padding: '4px 8px',
                          border: '1px solid var(--warm-slate-300)',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}
                      />
                      <span style={{ fontSize: '0.85rem', color: 'var(--warm-slate-700)' }}>
                        {item.days === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>
                ))}

                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'var(--soft-beige)',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ color: 'var(--aegean-blue)' }}>Total Duration:</strong>
                    <span style={{ color: 'var(--aegean-blue)', fontWeight: 'bold' }}>
                      {getTotalDays()} {getTotalDays() === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: 'var(--aegean-blue)' }}>Destinations:</strong>
                    <span style={{ color: 'var(--aegean-blue)', fontWeight: 'bold' }}>
                      {tripItems.length}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div style={{ 
        padding: '1.5rem', 
        background: 'var(--soft-beige)', 
        borderRadius: '12px',
        marginTop: '2rem'
      }}>
        <h4 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem' }}>💡 Planning Tips</h4>
        <ul style={{ 
          color: 'var(--warm-slate-700)', 
          lineHeight: '1.8',
          margin: 0,
          paddingLeft: '1.5rem'
        }}>
          <li>Add multiple destinations to create a comprehensive Turkish itinerary</li>
          <li>Adjust the number of days for each destination based on your interests</li>
          <li>Need help deciding? Chat with our AI Travel Agent for personalized recommendations</li>
          <li>This is a planning tool - bookings can be made through licensed travel providers</li>
        </ul>
      </div>
    </div>
  );
}

export default TripPlanner;
