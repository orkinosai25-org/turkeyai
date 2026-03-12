import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

const VERTICALS = [
  { key: 'hotels', label: 'Hotels & Resorts', icon: '🏨', description: 'Luxury and boutique hotels across Turkey\'s finest destinations.', color: 'var(--aegean-blue)' },
  { key: 'excursions', label: 'Excursions', icon: '🗺️', description: 'Curated day trips, tours, and authentic Turkish experiences.', color: 'var(--azure-turquoise)' },
  { key: 'transfers', label: 'Transfers', icon: '🚗', description: 'Private and shared airport transfers across Turkey.', color: 'var(--olive-green)' },
  { key: 'packages', label: 'Packages', icon: '🎒', description: 'All-inclusive and tailor-made Turkish holiday packages.', color: 'var(--soft-coral)' },
  { key: 'flights', label: 'Flights', icon: '✈️', description: 'Airport information and key route guidance for Turkey.', color: 'var(--bougainvillea-pink)' },
];

// ─── Excursion Card ───────────────────────────────────────────────────────────

function ExcursionCard({ exc }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ color: 'var(--aegean-blue)', fontSize: '1rem', margin: 0, flex: 1 }}>{exc.name}</h3>
        <span style={{
          background: 'var(--azure-turquoise)', color: 'white',
          borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap', marginLeft: '0.5rem'
        }}>
          {exc.type}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--warm-slate-500)' }}>
        <span>📍 {exc.destination}</span>
        <span>⏱ {exc.duration}</span>
        <span>🎯 {exc.difficulty}</span>
      </div>
      <p style={{ color: 'var(--warm-slate-700)', fontSize: '0.875rem', margin: 0 }}>{exc.description}</p>
      {exc.highlights && (
        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--warm-slate-700)', fontSize: '0.82rem' }}>
          {exc.highlights.slice(0, 3).map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      )}
      <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--warm-sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--aegean-blue)', fontWeight: 700 }}>
          From {exc.price_from} {exc.currency}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--warm-slate-500)' }}>Min age {exc.min_age || 0}+</span>
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--warm-slate-500)', margin: 0 }}>
        Indicative price – bookings via licensed providers
      </p>
    </div>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────────

function PackageCard({ pkg }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ fontSize: '2.5rem', textAlign: 'center' }}>{pkg.image_placeholder}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ color: 'var(--aegean-blue)', fontSize: '1rem', margin: 0, flex: 1 }}>{pkg.name}</h3>
        <span style={{
          background: 'var(--soft-coral)', color: 'white',
          borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap', marginLeft: '0.5rem'
        }}>
          {'⭐'.repeat(pkg.star_rating)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--warm-slate-500)' }}>
        <span>📍 {pkg.destination}</span>
        <span>🌙 {pkg.duration_nights} nights</span>
        <span>🍽️ {pkg.board_basis}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {(pkg.best_for || []).map(tag => (
          <span key={tag} style={{
            background: 'var(--soft-beige)', color: 'var(--aegean-blue)',
            borderRadius: '12px', padding: '2px 8px', fontSize: '0.72rem'
          }}>{tag}</span>
        ))}
      </div>
      {pkg.highlights && (
        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--warm-slate-700)', fontSize: '0.82rem' }}>
          {pkg.highlights.slice(0, 3).map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      )}
      <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--warm-sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--aegean-blue)', fontWeight: 700 }}>
          From {pkg.currency} {pkg.price_from_pp} pp
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--warm-slate-500)' }}>{pkg.category}</span>
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--warm-slate-500)', margin: 0 }}>
        Indicative pp price – via ATOL-protected licensed providers
      </p>
    </div>
  );
}

// ─── Transfer Card ────────────────────────────────────────────────────────────

function TransferCard({ transfer }) {
  return (
    <div className="card">
      <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>
        ✈️ {transfer.from} → 📍 {transfer.destination}
      </h3>
      <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
        {transfer.distance_km} km from airport
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
        {(transfer.vehicles || []).map(v => (
          <div key={v.id} style={{
            padding: '0.6rem 0.8rem', background: 'var(--soft-beige)', borderRadius: '8px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.85rem' }}>{v.icon} {v.vehicle} <span style={{ color: 'var(--warm-slate-500)', fontSize: '0.75rem' }}>(max {v.capacity})</span></span>
            <span style={{ color: 'var(--aegean-blue)', fontWeight: 700 }}>€{v.price_eur}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--warm-slate-500)', marginTop: '0.5rem', marginBottom: 0 }}>
        Indicative pricing – bookings via licensed ground transport providers
      </p>
    </div>
  );
}

// ─── Flight Panel ─────────────────────────────────────────────────────────────

function FlightPanel({ data }) {
  if (!data) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem' }}>🛬 Turkish Airports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {(data.airports || []).map(ap => (
            <div key={ap.code} className="card" style={{ padding: '0.75rem 1rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--aegean-blue)' }}>{ap.code}</span>
              <span style={{ color: 'var(--warm-slate-700)', fontSize: '0.875rem' }}> – {ap.name}</span>
              <div style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{ap.city}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem' }}>✈️ Popular UK Routes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(data.popular_uk_routes || []).map((route, i) => (
            <div key={i} style={{
              padding: '0.75rem 1rem', background: 'var(--soft-beige)', borderRadius: '8px',
              display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--warm-charcoal)' }}>{route.from}</span>
              <span style={{ color: 'var(--warm-slate-700)' }}>→ {route.to}</span>
              <span style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem', textAlign: 'right' }}>{route.approx_flight_time}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--warm-slate-500)', gridColumn: '1 / -1' }}>
                {route.airlines.join(' · ')}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--warm-slate-500)', marginTop: '0.75rem' }}>{data.note}</p>
      </div>
    </div>
  );
}

// ─── Main Services Page ───────────────────────────────────────────────────────

function Services() {
  const navigate = useNavigate();
  const [activeVertical, setActiveVertical] = useState('excursions');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [destFilter, setDestFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [boardFilter, setBoardFilter] = useState('');

  const DESTINATIONS = ['Bodrum', 'Antalya', 'Marmaris', 'Fethiye', 'Istanbul', 'Cappadocia', 'Kusadasi'];

  useEffect(() => {
    fetchVertical(activeVertical);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVertical, destFilter, typeFilter, boardFilter]);

  async function fetchVertical(vertical) {
    setLoading(true);
    setError(null);
    try {
      let url = '';
      const params = new URLSearchParams();

      if (destFilter) params.set('destination', destFilter);

      if (vertical === 'excursions') {
        if (typeFilter) params.set('type', typeFilter);
        url = `${API_BASE}/api/services/excursions?${params}`;
      } else if (vertical === 'packages') {
        if (boardFilter) params.set('board_basis', boardFilter);
        url = `${API_BASE}/api/services/packages?${params}`;
      } else if (vertical === 'transfers') {
        url = `${API_BASE}/api/services/transfers?${params}`;
      } else if (vertical === 'flights') {
        url = `${API_BASE}/api/services/flights`;
      } else if (vertical === 'hotels') {
        navigate('/destinations');
        return;
      }

      const res = await axios.get(url);
      setData(prev => ({ ...prev, [vertical]: res.data }));
    } catch (err) {
      setError('Could not load service data. Please ensure the API server is running.');
    } finally {
      setLoading(false);
    }
  }

  const currentData = data[activeVertical];

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>🌍 Travel Services</h1>
        <p style={{ color: 'var(--warm-slate-700)', fontSize: '1.05rem' }}>
          Everything you need for your perfect Turkish holiday – excursions, transfers, packages and more.
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--warm-slate-500)', background: 'var(--soft-beige)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'inline-block' }}>
          ℹ️ TürkiyeAI is an AI discovery platform. All bookings are completed via licensed travel providers.
        </p>
      </div>

      {/* Vertical Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {VERTICALS.map(v => (
          <button
            key={v.key}
            onClick={() => { setActiveVertical(v.key); setTypeFilter(''); setBoardFilter(''); }}
            style={{
              padding: '0.6rem 1.2rem', borderRadius: '24px', border: 'none', cursor: 'pointer',
              fontWeight: activeVertical === v.key ? 700 : 400,
              background: activeVertical === v.key ? v.color : 'var(--soft-beige)',
              color: activeVertical === v.key ? 'white' : 'var(--warm-charcoal)',
              fontSize: '0.95rem',
              transition: 'all 0.2s',
            }}
          >
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeVertical !== 'flights' && activeVertical !== 'hotels' && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <select
            value={destFilter}
            onChange={e => setDestFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--warm-sand)', fontSize: '0.9rem', background: 'white' }}
          >
            <option value="">All Destinations</option>
            {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {activeVertical === 'excursions' && (
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--warm-sand)', fontSize: '0.9rem', background: 'white' }}
            >
              <option value="">All Types</option>
              {['Cultural', 'Adventure', 'Boat Tour', 'Culinary', 'Wellness'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          {activeVertical === 'packages' && (
            <select
              value={boardFilter}
              onChange={e => setBoardFilter(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--warm-sand)', fontSize: '0.9rem', background: 'white' }}
            >
              <option value="">All Board Basis</option>
              {['All Inclusive', 'Half Board', 'Bed & Breakfast', 'Room Only'].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Content */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--warm-slate-500)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading service data...
        </div>
      )}

      {error && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && currentData && (
        <>
          {/* Excursions */}
          {activeVertical === 'excursions' && currentData.excursions && (
            <>
              <p style={{ color: 'var(--warm-slate-500)', marginBottom: '1.5rem' }}>
                {currentData.count} experience{currentData.count !== 1 ? 's' : ''} found
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {currentData.excursions.map(exc => <ExcursionCard key={exc.id} exc={exc} />)}
              </div>
            </>
          )}

          {/* Packages */}
          {activeVertical === 'packages' && currentData.packages && (
            <>
              <p style={{ color: 'var(--warm-slate-500)', marginBottom: '1.5rem' }}>
                {currentData.count} package{currentData.count !== 1 ? 's' : ''} found
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {currentData.packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
              </div>
            </>
          )}

          {/* Transfers */}
          {activeVertical === 'transfers' && currentData.transfers && (
            <>
              <p style={{ color: 'var(--warm-slate-500)', marginBottom: '1.5rem' }}>
                {currentData.count} route{currentData.count !== 1 ? 's' : ''} available
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {currentData.transfers.map(t => <TransferCard key={t.from + t.destination} transfer={t} />)}
              </div>
            </>
          )}

          {/* Flights */}
          {activeVertical === 'flights' && (
            <FlightPanel data={currentData} />
          )}
        </>
      )}

      {!loading && !error && !currentData && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--warm-slate-500)' }}>
          Select a service vertical above to browse options.
        </div>
      )}

      {/* AI Prompt CTA */}
      <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--soft-beige)', borderRadius: '12px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>🤖 Let AI Help You Plan</h3>
        <p style={{ color: 'var(--warm-slate-700)', marginBottom: '1.5rem' }}>
          Ask the TürkiyeAI travel agent to find excursions, compare packages, and build a complete itinerary for you.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/chat')}>
          Chat with AI Travel Agent
        </button>
      </div>
    </div>
  );
}

export default Services;
