import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

// ─── Proximity Bar ────────────────────────────────────────────────────────────

function ProximityBar({ score, label }) {
  const colour =
    score >= 75 ? 'var(--azure-turquoise)' :
    score >= 45 ? 'var(--olive-green)' :
    'var(--soft-coral)';

  return (
    <div style={{ marginBottom: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.82rem', color: 'var(--warm-slate-700)' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: colour }}>{score}/100</span>
      </div>
      <div style={{ height: '6px', background: 'var(--warm-sand)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: colour, borderRadius: '3px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }) {
  return (
    <span title={`${rating} star${rating !== 1 ? 's' : ''}`}>
      {'⭐'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

// ─── Amenity Badge ────────────────────────────────────────────────────────────

function AmenityBadge({ name, icon }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      background: 'var(--soft-beige)', color: 'var(--warm-charcoal)',
      borderRadius: '16px', padding: '4px 12px', fontSize: '0.82rem',
      border: '1px solid var(--warm-sand)'
    }}>
      {icon && <span>{icon}</span>}{name}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ResortDeepDive() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deepDive, setDeepDive] = useState(null);
  const [nearby, setNearby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchDeepDive(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchDeepDive(resortId) {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/resorts/${resortId}/deep-dive`);
      setDeepDive(res.data);
      fetchNearby(resortId);
    } catch (err) {
      setError('Could not load resort details. Please ensure the API server is running.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchNearby(resortId) {
    setNearbyLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/resorts/${resortId}/nearby?limit=5`);
      setNearby(res.data);
    } catch {
      // Non-critical – silently skip
    } finally {
      setNearbyLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <p style={{ color: 'var(--warm-slate-500)' }}>Generating AI deep dive...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          ⚠️ {error}
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/destinations')}>← Back to Destinations</button>
      </div>
    );
  }

  if (!deepDive) return null;

  const { resort, amenities_by_category, proximity_to_attractions, ai_insights, disclaimer } = deepDive;

  return (
    <div className="page">
      {/* Back Nav */}
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--aegean-blue)', fontSize: '0.9rem', padding: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
      >
        ← Back
      </button>

      {/* Header */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <span style={{
              background: 'var(--aegean-blue)', color: 'white',
              borderRadius: '20px', padding: '3px 12px', fontSize: '0.78rem', fontWeight: 700
            }}>
              AI Deep Dive
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--warm-slate-500)' }}>
              📍 {resort.destination}, {resort.region}
            </span>
          </div>
          <h1 style={{ color: 'var(--aegean-blue)', marginBottom: '0.4rem' }}>{resort.name}</h1>
          <div style={{ marginBottom: '0.5rem' }}>
            <StarRating rating={resort.star_rating || 0} />
            {resort.price_range && (
              <span style={{ marginLeft: '0.75rem', color: 'var(--warm-slate-500)', fontSize: '0.9rem' }}>{resort.price_range}</span>
            )}
          </div>
          {resort.description && (
            <p style={{ color: 'var(--warm-slate-700)', lineHeight: 1.7 }}>{resort.description}</p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* AI Insights Panel */}
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--aegean-blue) 0%, var(--azure-turquoise) 100%)', color: 'white' }}>
          <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem' }}>🧠 AI Travel Insights</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {(ai_insights || []).map((insight, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.9rem' }}>
                <span>✦</span>
                <span style={{ opacity: 0.95 }}>{insight}</span>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: '1rem', marginBottom: 0 }}>{disclaimer}</p>
        </div>

        {/* Quick Details */}
        <div className="card">
          <h2 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem', fontSize: '1.1rem' }}>🏨 Resort Details</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <tbody>
              {resort.room_count && (
                <tr>
                  <td style={{ padding: '0.3rem 0', color: 'var(--warm-slate-500)', width: '40%' }}>Rooms</td>
                  <td style={{ color: 'var(--warm-charcoal)' }}>{resort.room_count}</td>
                </tr>
              )}
              {resort.check_in_time && (
                <tr>
                  <td style={{ padding: '0.3rem 0', color: 'var(--warm-slate-500)' }}>Check-in</td>
                  <td style={{ color: 'var(--warm-charcoal)' }}>{resort.check_in_time}</td>
                </tr>
              )}
              {resort.check_out_time && (
                <tr>
                  <td style={{ padding: '0.3rem 0', color: 'var(--warm-slate-500)' }}>Check-out</td>
                  <td style={{ color: 'var(--warm-charcoal)' }}>{resort.check_out_time}</td>
                </tr>
              )}
              {resort.address && (
                <tr>
                  <td style={{ padding: '0.3rem 0', color: 'var(--warm-slate-500)', verticalAlign: 'top' }}>Address</td>
                  <td style={{ color: 'var(--warm-charcoal)' }}>{resort.address}</td>
                </tr>
              )}
            </tbody>
          </table>
          {resort.website_url && (
            <a
              href={resort.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.85rem' }}
            >
              🌐 Visit Website
            </a>
          )}
          {resort.booking_url && (
            <a
              href={resort.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ display: 'inline-block', marginTop: '0.5rem', marginLeft: resort.website_url ? '0.5rem' : 0, fontSize: '0.85rem', background: 'var(--azure-turquoise)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', textDecoration: 'none' }}
            >
              📅 Book Now
            </a>
          )}
        </div>

        {/* Proximity */}
        {proximity_to_attractions && proximity_to_attractions.length > 0 && (
          <div className="card">
            <h2 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem', fontSize: '1.1rem' }}>📍 Proximity Scores</h2>
            {proximity_to_attractions.map((p, i) => (
              <div key={i} style={{ marginBottom: '0.75rem' }}>
                <ProximityBar
                  score={p.score}
                  label={`${p.name} (${p.distance_km} km)`}
                />
              </div>
            ))}
            <p style={{ fontSize: '0.78rem', color: 'var(--warm-slate-500)', marginTop: '0.5rem', marginBottom: 0 }}>
              Proximity score: 100 = walking distance · 0 = very far
            </p>
          </div>
        )}
      </div>

      {/* Amenities */}
      {amenities_by_category && Object.keys(amenities_by_category).length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--aegean-blue)', marginBottom: '1.5rem' }}>🏊 Facilities & Amenities</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {Object.entries(amenities_by_category).map(([category, items]) => (
              <div key={category}>
                <h4 style={{ color: 'var(--azure-turquoise)', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{category}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {items.map((item, i) => <AmenityBadge key={i} name={item.name} icon={item.icon} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Hotels */}
      {nearbyLoading && (
        <div style={{ color: 'var(--warm-slate-500)', padding: '1rem 0' }}>Loading nearby hotels...</div>
      )}

      {!nearbyLoading && nearby && nearby.nearby_resorts && nearby.nearby_resorts.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>🏨 Nearby Hotels</h2>
          <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            AI Proximity Learning – hotels close to {resort.name}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {nearby.nearby_resorts.map(r => (
              <button
                key={r.id}
                onClick={() => navigate(`/resorts/${r.id}/deep-dive`)}
                style={{
                  padding: '0.75rem 1rem', background: 'var(--soft-beige)', border: '1px solid var(--warm-sand)',
                  borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--warm-sand)'}
                onMouseOut={e => e.currentTarget.style.background = 'var(--soft-beige)'}
              >
                <div style={{ fontWeight: 600, color: 'var(--aegean-blue)', marginBottom: '0.2rem' }}>{r.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--warm-slate-500)', display: 'flex', gap: '0.5rem' }}>
                  <span>{'⭐'.repeat(r.star_rating || 0)}</span>
                  <span>{r.distance_km} km away</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ background: 'var(--soft-beige)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>🤖 Ask AI About This Resort</h3>
        <p style={{ color: 'var(--warm-slate-700)', marginBottom: '1rem' }}>
          Get personalised recommendations and answers from the TürkiyeAI travel agent.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/chat')}>
          Chat with AI Travel Agent
        </button>
      </div>
    </div>
  );
}

export default ResortDeepDive;
