import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

const DESTINATIONS = ['All', 'Bodrum', 'Antalya', 'Cappadocia', 'Marmaris', 'Fethiye', 'Istanbul', 'Kusadasi'];
const TOUR_TYPES = ['All', 'Cultural', 'Adventure', 'Boat Tour', 'Culinary', 'Wellness'];

function TourCard({ tour, onSelect, isSelected }) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        border: isSelected ? '2px solid var(--aegean-blue)' : '2px solid var(--warm-slate-200)',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      onClick={() => onSelect && onSelect(tour)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ color: 'var(--aegean-blue)', fontSize: '1rem', margin: 0, flex: 1 }}>{tour.name}</h3>
        <span style={{
          background: 'var(--azure-turquoise)',
          color: 'white',
          borderRadius: '20px',
          padding: '2px 10px',
          fontSize: '0.75rem',
          whiteSpace: 'nowrap',
          marginLeft: '0.5rem',
        }}>
          {tour.type}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--warm-slate-500)' }}>
        <span>📍 {tour.destination}</span>
        <span>⏱ {tour.duration}</span>
        <span>🎯 {tour.difficulty}</span>
        <span>👥 {tour.group_size}</span>
      </div>

      <p style={{ color: 'var(--warm-slate-700)', fontSize: '0.875rem', margin: 0 }}>{tour.description}</p>

      {tour.highlights && (
        <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.2rem', color: 'var(--warm-slate-700)', fontSize: '0.82rem' }}>
          {tour.highlights.slice(0, 3).map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      )}

      <div style={{
        marginTop: 'auto',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--warm-slate-200)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span style={{ color: 'var(--aegean-blue)', fontWeight: 700, fontSize: '1.05rem' }}>
            From {tour.price_from} {tour.currency}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--warm-slate-500)', display: 'block' }}>
            per person
          </span>
        </div>
        {onSelect ? (
          <button
            className={isSelected ? 'btn' : 'btn btn-primary'}
            style={{
              fontSize: '0.8rem',
              padding: '0.4rem 0.9rem',
              background: isSelected ? 'var(--olive-green)' : undefined,
            }}
            onClick={(e) => { e.stopPropagation(); onSelect(tour); }}
          >
            {isSelected ? '✓ Added' : '+ Add to Holiday'}
          </button>
        ) : (
          <a
            href="https://partnerresources.viator.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', textDecoration: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            Book via Viator →
          </a>
        )}
      </div>

      {tour.min_age > 0 && (
        <p style={{ fontSize: '0.72rem', color: 'var(--warm-slate-500)', margin: 0 }}>
          Min age {tour.min_age}+
        </p>
      )}
    </div>
  );
}

function Tours({ onAddToHoliday, selectedTours = [] }) {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [destFilter, setDestFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchTours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (destFilter && destFilter !== 'All') params.destination = destFilter;
      if (typeFilter && typeFilter !== 'All') params.type = typeFilter;
      const res = await axios.get(`${API_BASE}/api/services/excursions`, { params });
      setTours(res.data.excursions || []);
    } catch (err) {
      console.error('Error fetching tours:', err);
      setError('Failed to load tours. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [destFilter, typeFilter]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const visibleTours = search
    ? tours.filter(
        t =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.destination.toLowerCase().includes(search.toLowerCase())
      )
    : tours;

  const isSelected = useCallback(
    (tour) => selectedTours.some(t => t.id === tour.id),
    [selectedTours]
  );

  return (
    <div className="page">
      <h1 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>
        🗺️ Tours &amp; Excursions
      </h1>
      <p style={{ color: 'var(--warm-slate-500)', marginBottom: '2rem' }}>
        Curated day trips, guided tours, and authentic Turkish experiences
      </p>

      {/* AI tip banner */}
      <div style={{
        background: 'linear-gradient(135deg, #eef4ff 0%, #f0fdf4 100%)',
        border: '1px solid #c7d7fc',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '1.4rem' }}>🤖</span>
        <div>
          <strong style={{ color: 'var(--aegean-blue)' }}>AI Tip:</strong>
          <span style={{ color: 'var(--warm-slate-700)', marginLeft: '0.35rem' }}>
            Not sure which tours to pick? Ask our{' '}
            <a href="/chat" style={{ color: 'var(--aegean-blue)', fontWeight: 600 }}>
              AI Travel Agent
            </a>{' '}
            for personalised tour recommendations based on your interests.
          </span>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem',
        alignItems: 'center',
      }}>
        <input
          type="text"
          placeholder="Search tours…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '2px solid var(--warm-slate-300)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            minWidth: '200px',
            flex: '1 1 200px',
          }}
        />

        <select
          value={destFilter}
          onChange={(e) => setDestFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '2px solid var(--warm-slate-300)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            flex: '1 1 140px',
          }}
        >
          {DESTINATIONS.map(d => (
            <option key={d} value={d}>{d === 'All' ? 'All Destinations' : d}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '2px solid var(--warm-slate-300)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            flex: '1 1 140px',
          }}
        >
          {TOUR_TYPES.map(t => (
            <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--warm-slate-500)' }}>
          Loading tours…
        </div>
      )}

      {error && (
        <div style={{ color: 'red', padding: '1rem', background: '#fef2f2', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {!loading && !error && visibleTours.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--warm-slate-500)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <p>No tours found matching your filters.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '0.75rem' }}
            onClick={() => { setDestFilter('All'); setTypeFilter('All'); setSearch(''); }}
          >
            Clear filters
          </button>
        </div>
      )}

      {!loading && visibleTours.length > 0 && (
        <>
          <p style={{ color: 'var(--warm-slate-500)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {visibleTours.length} tour{visibleTours.length !== 1 ? 's' : ''} found
            {onAddToHoliday && selectedTours.length > 0 && (
              <span style={{ marginLeft: '1rem', color: 'var(--olive-green)', fontWeight: 600 }}>
                ✓ {selectedTours.length} added to your holiday
              </span>
            )}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {visibleTours.map(tour => (
              <TourCard
                key={tour.id}
                tour={tour}
                onSelect={onAddToHoliday || null}
                isSelected={isSelected(tour)}
              />
            ))}
          </div>
        </>
      )}

      <div style={{
        marginTop: '2.5rem',
        padding: '1.25rem',
        background: 'var(--soft-beige)',
        borderRadius: '12px',
        fontSize: '0.82rem',
        color: 'var(--warm-slate-500)',
      }}>
        <strong>Disclaimer:</strong> Tour prices are indicative. Bookings are completed via licensed providers
        (Viator / GetYourGuide). TürkiyeAI is an AI discovery platform.
      </div>
    </div>
  );
}

export { TourCard };
export default Tours;
