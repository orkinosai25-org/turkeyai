import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TourCard } from './Tours';

const API_BASE = process.env.REACT_APP_API_URL || '';

const DESTINATIONS = ['Bodrum', 'Antalya', 'Cappadocia', 'Marmaris', 'Fethiye', 'Istanbul', 'Kusadasi', 'Izmir'];

// Default check-in (today + 30 days) and check-out (today + 37 days)
function isoDate(daysFromNow = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate whole-day difference between two ISO date strings using UTC
 * midnight values so that DST transitions do not skew the count.
 */
function daysBetween(isoFrom, isoTo) {
  if (!isoFrom || !isoTo) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  const [fy, fm, fd] = isoFrom.split('-').map(Number);
  const [ty, tm, td] = isoTo.split('-').map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  if (isNaN(from) || isNaN(to)) return null;
  return Math.round((to - from) / msPerDay);
}

const STEPS = [
  { id: 1, label: 'Destination', icon: '📍' },
  { id: 2, label: 'Hotel', icon: '🏨' },
  { id: 3, label: 'Flights', icon: '✈️' },
  { id: 4, label: 'Transfer', icon: '🚌' },
  { id: 5, label: 'Tours', icon: '🗺️' },
  { id: 6, label: 'Summary', icon: '✅' },
];

// ─── Step progress bar ────────────────────────────────────────────────────────

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '0' }}>
      {STEPS.map((step, idx) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <React.Fragment key={step.id}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              minWidth: '72px',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: done ? 'var(--olive-green)' : active ? 'var(--aegean-blue)' : 'var(--warm-slate-300)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: done ? '1rem' : '0.9rem',
                fontWeight: 700,
                transition: 'background 0.3s',
              }}>
                {done ? '✓' : step.icon}
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: active ? 700 : 400,
                color: active ? 'var(--aegean-blue)' : 'var(--warm-slate-500)',
              }}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{
                height: '2px',
                width: '24px',
                background: done ? 'var(--olive-green)' : 'var(--warm-slate-300)',
                alignSelf: 'flex-start',
                marginTop: '17px',
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Step 1 – Destination & Dates ────────────────────────────────────────────

function Step1({ form, setForm, onNext }) {
  const isValid = form.destination && form.checkIn && form.checkOut &&
    new Date(form.checkOut) > new Date(form.checkIn);

  return (
    <div className="card" style={{ maxWidth: '560px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--aegean-blue)', marginBottom: '1.5rem' }}>
        📍 Where would you like to go?
      </h2>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--warm-slate-700)' }}>
          Destination
        </label>
        <select
          value={form.destination}
          onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))}
          style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--warm-slate-300)', borderRadius: '8px', fontSize: '1rem' }}
        >
          <option value="">Select a destination…</option>
          {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--warm-slate-700)' }}>
            Check-in
          </label>
          <input
            type="date"
            value={form.checkIn}
            min={isoDate(1)}
            onChange={(e) => setForm(f => ({ ...f, checkIn: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--warm-slate-300)', borderRadius: '8px', fontSize: '1rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--warm-slate-700)' }}>
            Check-out
          </label>
          <input
            type="date"
            value={form.checkOut}
            min={form.checkIn || isoDate(2)}
            onChange={(e) => setForm(f => ({ ...f, checkOut: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--warm-slate-300)', borderRadius: '8px', fontSize: '1rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--warm-slate-700)' }}>
            Adults
          </label>
          <select
            value={form.adults}
            onChange={(e) => setForm(f => ({ ...f, adults: parseInt(e.target.value, 10) }))}
            style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--warm-slate-300)', borderRadius: '8px', fontSize: '1rem' }}
          >
            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Adult{n !== 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--warm-slate-700)' }}>
            Children
          </label>
          <select
            value={form.children}
            onChange={(e) => setForm(f => ({ ...f, children: parseInt(e.target.value, 10) }))}
            style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--warm-slate-300)', borderRadius: '8px', fontSize: '1rem' }}
          >
            {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} {n !== 1 ? 'Children' : 'Child'}</option>)}
          </select>
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={onNext}
        disabled={!isValid}
        style={{ width: '100%', fontSize: '1rem', padding: '0.8rem' }}
      >
        Search Hotels →
      </button>
    </div>
  );
}

// ─── Step 2 – Hotel selection ─────────────────────────────────────────────────

function HotelCard({ hotel, isSelected, onSelect }) {
  const stars = '⭐'.repeat(Math.min(parseInt(hotel.categoryCode, 10) || 0, 5));
  return (
    <div
      className="card"
      style={{
        border: isSelected ? '2px solid var(--aegean-blue)' : '2px solid var(--warm-slate-200)',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
      onClick={() => onSelect(hotel)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
        <h3 style={{ margin: 0, color: 'var(--aegean-blue)', fontSize: '1rem', flex: 1, paddingRight: '0.5rem' }}>{hotel.name}</h3>
        {isSelected && (
          <span style={{ background: 'var(--aegean-blue)', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>✓</span>
        )}
      </div>
      {stars && <div style={{ marginBottom: '0.3rem' }}>{stars}</div>}
      <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.82rem', margin: '0 0 0.5rem' }}>
        📍 {[hotel.zoneName, hotel.destinationName].filter(Boolean).join(', ')}
      </p>
      {hotel.address && (
        <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.78rem', margin: '0 0 0.5rem' }}>{hotel.address}</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        {hotel.minRate ? (
          <span style={{ color: 'var(--aegean-blue)', fontWeight: 700 }}>
            From {hotel.currency || 'GBP'} {hotel.minRate}<span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--warm-slate-500)' }}>/night</span>
          </span>
        ) : <span />}
        <button
          className={isSelected ? 'btn' : 'btn btn-primary'}
          style={{
            fontSize: '0.78rem',
            padding: '0.35rem 0.8rem',
            background: isSelected ? 'var(--olive-green)' : undefined,
          }}
          onClick={(e) => { e.stopPropagation(); onSelect(hotel); }}
        >
          {isSelected ? '✓ Selected' : 'Select'}
        </button>
      </div>
    </div>
  );
}

function Step2({ form, selectedHotel, setSelectedHotel, onNext, onBack }) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`${API_BASE}/api/hotels/search`, { params: { destination: form.destination } })
      .then(res => { setHotels(res.data.hotels || []); })
      .catch(() => setError('Could not load hotels. Please try again.'))
      .finally(() => setLoading(false));
  }, [form.destination]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--aegean-blue)', margin: 0 }}>🏨 Choose Your Hotel in {form.destination}</h2>
        <button onClick={onBack} style={{ background: 'transparent', border: '1.5px solid var(--warm-slate-400)', borderRadius: '6px', padding: '0.35rem 0.8rem', cursor: 'pointer', color: 'var(--warm-slate-600)', fontSize: '0.82rem' }}>← Back</button>
      </div>

      {loading && <p style={{ color: 'var(--warm-slate-500)', textAlign: 'center', padding: '2rem' }}>Loading hotels…</p>}
      {error && <p style={{ color: 'red', padding: '0.75rem', background: '#fef2f2', borderRadius: '8px' }}>{error}</p>}

      {!loading && hotels.length === 0 && !error && (
        <p style={{ color: 'var(--warm-slate-500)', textAlign: 'center', padding: '2rem' }}>No hotels found for {form.destination}.</p>
      )}

      {!loading && hotels.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {hotels.map(h => (
            <HotelCard
              key={h.code}
              hotel={h}
              isSelected={selectedHotel && selectedHotel.code === h.code}
              onSelect={setSelectedHotel}
            />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <span style={{ color: 'var(--warm-slate-500)', fontSize: '0.85rem' }}>
          {selectedHotel ? `Selected: ${selectedHotel.name}` : 'No hotel selected yet (optional)'}
        </span>
        <button className="btn btn-primary" onClick={onNext} style={{ fontSize: '1rem', padding: '0.7rem 1.5rem' }}>
          Next: Flights →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 – Flights ─────────────────────────────────────────────────────────

function Step3({ form, plan, selectedFlight, setSelectedFlight, onNext, onBack }) {
  const links = plan ? plan.affiliate_booking_links || [] : [];
  const nights = daysBetween(form.checkIn, form.checkOut);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--aegean-blue)', margin: 0 }}>✈️ Flights to {form.destination}</h2>
        <button onClick={onBack} style={{ background: 'transparent', border: '1.5px solid var(--warm-slate-400)', borderRadius: '6px', padding: '0.35rem 0.8rem', cursor: 'pointer', color: 'var(--warm-slate-600)', fontSize: '0.82rem' }}>← Back</button>
      </div>

      <div style={{ background: 'var(--soft-beige)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.88rem', color: 'var(--warm-slate-700)' }}>
        <strong>Your search:</strong> {form.destination} · {form.checkIn} → {form.checkOut}
        {nights && ` · ${nights} nights`} · {form.adults} adult{form.adults !== 1 ? 's' : ''}{form.children > 0 ? `, ${form.children} child${form.children !== 1 ? 'ren' : ''}` : ''}
      </div>

      <p style={{ color: 'var(--warm-slate-600)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Live flight search is powered by the <strong>Amadeus GDS</strong> integration (activation pending).
        In the meantime, click through to one of our ATOL-protected partner providers to complete your flight booking:
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {links.map((link) => (
          <div
            key={link.provider}
            className="card"
            style={{
              border: selectedFlight === link.provider ? '2px solid var(--aegean-blue)' : '2px solid var(--warm-slate-200)',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onClick={() => setSelectedFlight(link.provider)}
          >
            <div style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '0.4rem' }}>{link.icon}</div>
            <h3 style={{ color: 'var(--aegean-blue)', textAlign: 'center', margin: '0 0 0.3rem', fontSize: '1rem' }}>{link.provider}</h3>
            <p style={{ color: 'var(--warm-slate-500)', textAlign: 'center', fontSize: '0.8rem', margin: '0 0 0.75rem' }}>{link.description}</p>
            {link.atol_protected && (
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <span style={{ background: '#f0fdf4', color: '#15803d', borderRadius: '20px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                  🛡️ ATOL Protected
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                className={selectedFlight === link.provider ? 'btn' : 'btn btn-primary'}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem', background: selectedFlight === link.provider ? 'var(--olive-green)' : undefined }}
                onClick={(e) => { e.stopPropagation(); setSelectedFlight(link.provider); }}
              >
                {selectedFlight === link.provider ? '✓ Chosen' : 'Choose'}
              </button>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem', background: 'var(--soft-beige)', borderRadius: '6px', color: 'var(--aegean-blue)', textDecoration: 'none', border: '1px solid var(--warm-slate-300)', fontWeight: 500 }}
                onClick={(e) => e.stopPropagation()}
              >
                View →
              </a>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <span style={{ color: 'var(--warm-slate-500)', fontSize: '0.85rem' }}>
          {selectedFlight ? `✓ Flying with ${selectedFlight}` : 'No flight provider chosen yet (optional)'}
        </span>
        <button className="btn btn-primary" onClick={onNext} style={{ fontSize: '1rem', padding: '0.7rem 1.5rem' }}>
          Next: Transfer →
        </button>
      </div>
    </div>
  );
}

// ─── Step 4 – Transfer ────────────────────────────────────────────────────────

function TransferCard({ route, vehicle, isSelected, onSelect }) {
  return (
    <div
      className="card"
      style={{
        border: isSelected ? '2px solid var(--aegean-blue)' : '2px solid var(--warm-slate-200)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        transition: 'border-color 0.2s',
      }}
      onClick={() => onSelect({ route, vehicle })}
    >
      <div style={{ fontSize: '1.5rem', textAlign: 'center' }}>{vehicle.icon}</div>
      <h3 style={{ color: 'var(--aegean-blue)', textAlign: 'center', fontSize: '0.95rem', margin: '0 0 0.2rem' }}>
        {vehicle.vehicle}
      </h3>
      <p style={{ color: 'var(--warm-slate-500)', textAlign: 'center', fontSize: '0.78rem', margin: 0 }}>
        {route.from} → {route.destination} · {route.distance_km} km
      </p>
      <p style={{ color: 'var(--warm-slate-600)', fontSize: '0.8rem', textAlign: 'center', margin: '0.25rem 0' }}>
        {vehicle.description}
      </p>
      <p style={{ color: 'var(--warm-slate-500)', textAlign: 'center', fontSize: '0.72rem', margin: 0 }}>
        Up to {vehicle.capacity} passengers
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--warm-slate-200)' }}>
        <span style={{ color: 'var(--aegean-blue)', fontWeight: 700 }}>€{vehicle.price_eur}</span>
        <button
          className={isSelected ? 'btn' : 'btn btn-primary'}
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', background: isSelected ? 'var(--olive-green)' : undefined }}
          onClick={(e) => { e.stopPropagation(); onSelect({ route, vehicle }); }}
        >
          {isSelected ? '✓' : 'Select'}
        </button>
      </div>
    </div>
  );
}

function Step4({ form, plan, selectedTransfer, setSelectedTransfer, onNext, onBack }) {
  const transfers = plan ? plan.transfers || [] : [];

  const allVehicleOptions = [];
  transfers.forEach(route => {
    (route.vehicles || []).forEach(v => {
      allVehicleOptions.push({ route, vehicle: v });
    });
  });

  function isTransferSelected(vehicle, route) {
    return (
      selectedTransfer != null &&
      selectedTransfer.vehicle != null &&
      selectedTransfer.vehicle.id === vehicle.id &&
      selectedTransfer.route != null &&
      selectedTransfer.route.from === route.from
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--aegean-blue)', margin: 0 }}>🚌 Airport Transfer to {form.destination}</h2>
        <button onClick={onBack} style={{ background: 'transparent', border: '1.5px solid var(--warm-slate-400)', borderRadius: '6px', padding: '0.35rem 0.8rem', cursor: 'pointer', color: 'var(--warm-slate-600)', fontSize: '0.82rem' }}>← Back</button>
      </div>

      {allVehicleOptions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--warm-slate-500)', background: 'var(--limestone-white)', borderRadius: '10px', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <p>No transfers configured for {form.destination} yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {allVehicleOptions.map(({ route, vehicle }) => {
            const key = `${route.from}-${route.destination}-${vehicle.id}`;
            const isSel = isTransferSelected(vehicle, route);
            return (
              <TransferCard
                key={key}
                route={route}
                vehicle={vehicle}
                isSelected={isSel}
                onSelect={setSelectedTransfer}
              />
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <span style={{ color: 'var(--warm-slate-500)', fontSize: '0.85rem' }}>
          {selectedTransfer
            ? `✓ ${selectedTransfer.vehicle.vehicle} to ${selectedTransfer.route.destination} (€${selectedTransfer.vehicle.price_eur})`
            : 'No transfer selected (optional)'}
        </span>
        <button className="btn btn-primary" onClick={onNext} style={{ fontSize: '1rem', padding: '0.7rem 1.5rem' }}>
          Next: Tours →
        </button>
      </div>
    </div>
  );
}

// ─── Step 5 – Tours & Excursions ──────────────────────────────────────────────

function Step5({ form, plan, selectedTours, setSelectedTours, onNext, onBack }) {
  const excursions = plan ? plan.excursions || [] : [];

  function toggleTour(tour) {
    setSelectedTours(prev =>
      prev.some(t => t.id === tour.id)
        ? prev.filter(t => t.id !== tour.id)
        : [...prev, tour]
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--aegean-blue)', margin: 0 }}>🗺️ Tours &amp; Excursions in {form.destination}</h2>
        <button onClick={onBack} style={{ background: 'transparent', border: '1.5px solid var(--warm-slate-400)', borderRadius: '6px', padding: '0.35rem 0.8rem', cursor: 'pointer', color: 'var(--warm-slate-600)', fontSize: '0.82rem' }}>← Back</button>
      </div>

      {excursions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--warm-slate-500)', background: 'var(--limestone-white)', borderRadius: '10px', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <p>No tours found for {form.destination}.</p>
          <p style={{ fontSize: '0.85rem' }}>
            <a href="/tours" style={{ color: 'var(--aegean-blue)' }}>Browse all tours →</a>
          </p>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--warm-slate-500)', marginBottom: '1rem', fontSize: '0.88rem' }}>
            Select any tours you'd like to add to your holiday. You can choose multiple.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {excursions.map(tour => (
              <TourCard
                key={tour.id}
                tour={tour}
                onSelect={toggleTour}
                isSelected={selectedTours.some(t => t.id === tour.id)}
              />
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <span style={{ color: 'var(--warm-slate-500)', fontSize: '0.85rem' }}>
          {selectedTours.length > 0 ? `✓ ${selectedTours.length} tour${selectedTours.length !== 1 ? 's' : ''} added` : 'No tours selected (optional)'}
        </span>
        <button className="btn btn-primary" onClick={onNext} style={{ fontSize: '1rem', padding: '0.7rem 1.5rem' }}>
          Review Summary →
        </button>
      </div>
    </div>
  );
}

// ─── Step 6 – Booking Summary ─────────────────────────────────────────────────

function Step6({ form, plan, selectedHotel, selectedFlight, selectedTransfer, selectedTours, onBack, onReset }) {
  const navigate = useNavigate();
  const nights = daysBetween(form.checkIn, form.checkOut);

  const links = plan ? plan.affiliate_booking_links || [] : [];
  const chosenLink = links.find(l => l.provider === selectedFlight);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--aegean-blue)', margin: 0 }}>✅ Your Holiday Summary</h2>
        <button onClick={onBack} style={{ background: 'transparent', border: '1.5px solid var(--warm-slate-400)', borderRadius: '6px', padding: '0.35rem 0.8rem', cursor: 'pointer', color: 'var(--warm-slate-600)', fontSize: '0.82rem' }}>← Back</button>
      </div>

      {/* Destination header */}
      <div style={{ background: 'linear-gradient(135deg, #e0f0ff 0%, #eef4ff 100%)', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--aegean-blue)', margin: '0 0 0.3rem' }}>
          🇹🇷 {form.destination} Holiday
        </h3>
        <p style={{ color: 'var(--warm-slate-600)', margin: 0, fontSize: '0.9rem' }}>
          {form.checkIn} → {form.checkOut}
          {nights && ` · ${nights} night${nights !== 1 ? 's' : ''}`}
          {' · '}{form.adults} adult{form.adults !== 1 ? 's' : ''}
          {form.children > 0 && `, ${form.children} child${form.children !== 1 ? 'ren' : ''}`}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Hotel */}
        <div className="card" style={{ border: '1px solid var(--warm-slate-200)', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>🏨</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--aegean-blue)' }}>Hotel</strong>
              {selectedHotel ? (
                <>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--warm-slate-700)' }}>{selectedHotel.name}</p>
                  <p style={{ margin: '0.1rem 0 0', color: 'var(--warm-slate-500)', fontSize: '0.82rem' }}>
                    {[selectedHotel.zoneName, selectedHotel.destinationName].filter(Boolean).join(', ')}
                    {selectedHotel.minRate && ` · From ${selectedHotel.currency || 'GBP'} ${selectedHotel.minRate}/night`}
                  </p>
                </>
              ) : (
                <p style={{ margin: '0.2rem 0 0', color: 'var(--warm-slate-500)', fontSize: '0.85rem' }}>
                  Not selected —{' '}
                  <button onClick={() => onBack(2)} style={{ background: 'none', border: 'none', color: 'var(--aegean-blue)', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: '0.85rem' }}>choose hotel</button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Flights */}
        <div className="card" style={{ border: '1px solid var(--warm-slate-200)', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>✈️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--aegean-blue)' }}>Flights</strong>
              {selectedFlight ? (
                <>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--warm-slate-700)' }}>Flying with {selectedFlight}</p>
                  {chosenLink && (
                    <a href={chosenLink.url} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--aegean-blue)', fontSize: '0.82rem', fontWeight: 600 }}>
                      Complete booking at {selectedFlight} →
                    </a>
                  )}
                </>
              ) : (
                <p style={{ margin: '0.2rem 0 0', color: 'var(--warm-slate-500)', fontSize: '0.85rem' }}>
                  Not selected —{' '}
                  <button onClick={() => onBack(3)} style={{ background: 'none', border: 'none', color: 'var(--aegean-blue)', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: '0.85rem' }}>choose flight provider</button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Transfer */}
        <div className="card" style={{ border: '1px solid var(--warm-slate-200)', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>🚌</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--aegean-blue)' }}>Airport Transfer</strong>
              {selectedTransfer ? (
                <p style={{ margin: '0.2rem 0 0', color: 'var(--warm-slate-700)' }}>
                  {selectedTransfer.vehicle.vehicle} · {selectedTransfer.route.from} → {selectedTransfer.route.destination} · €{selectedTransfer.vehicle.price_eur}
                </p>
              ) : (
                <p style={{ margin: '0.2rem 0 0', color: 'var(--warm-slate-500)', fontSize: '0.85rem' }}>
                  Not selected —{' '}
                  <button onClick={() => onBack(4)} style={{ background: 'none', border: 'none', color: 'var(--aegean-blue)', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: '0.85rem' }}>add transfer</button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tours */}
        <div className="card" style={{ border: '1px solid var(--warm-slate-200)', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>🗺️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--aegean-blue)' }}>Tours &amp; Excursions</strong>
              {selectedTours.length > 0 ? (
                <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.2rem', color: 'var(--warm-slate-700)', fontSize: '0.85rem' }}>
                  {selectedTours.map(t => (
                    <li key={t.id}>{t.name} – From {t.price_from} {t.currency}/person</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: '0.2rem 0 0', color: 'var(--warm-slate-500)', fontSize: '0.85rem' }}>
                  No tours selected —{' '}
                  <button onClick={() => onBack(5)} style={{ background: 'none', border: 'none', color: 'var(--aegean-blue)', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: '0.85rem' }}>add tours</button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking CTA section */}
      <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--aegean-blue)', marginTop: 0, marginBottom: '0.5rem' }}>
          🎉 Ready to book?
        </h3>
        <p style={{ color: 'var(--warm-slate-600)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          All bookings are completed with ATOL-protected providers. TürkiyeAI earns a referral commission — you pay the same price or less.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {chosenLink ? (
            <a
              href={chosenLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.8rem 1.5rem' }}
            >
              {chosenLink.cta} 🚀
            </a>
          ) : links.length > 0 ? (
            links.slice(0, 2).map(l => (
              <a
                key={l.provider}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ textDecoration: 'none', fontSize: '0.9rem', padding: '0.7rem 1.2rem' }}
              >
                {l.cta} {l.icon}
              </a>
            ))
          ) : null}
          <button
            className="btn"
            style={{ fontSize: '0.9rem', padding: '0.7rem 1.2rem', background: 'white', border: '1.5px solid var(--aegean-blue)', color: 'var(--aegean-blue)' }}
            onClick={() => navigate('/chat')}
          >
            🤖 Ask AI Agent for help
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={onReset}
          style={{ background: 'transparent', border: '1.5px solid var(--bougainvillea-pink)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--bougainvillea-pink)', fontSize: '0.85rem' }}
        >
          Start Over
        </button>
        <p style={{ color: 'var(--warm-slate-400)', fontSize: '0.72rem', alignSelf: 'center' }}>
          Prices indicative. Final prices confirmed at booking.
        </p>
      </div>
    </div>
  );
}

// ─── Main HolidayPlanner component ───────────────────────────────────────────

function HolidayPlanner() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    destination: '',
    checkIn: isoDate(30),
    checkOut: isoDate(37),
    adults: 2,
    children: 0,
  });
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Selections
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [selectedTours, setSelectedTours] = useState([]);

  const fetchPlan = useCallback(async () => {
    if (!form.destination) return;
    setPlanLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/holidays/plan`, {
        params: {
          destination: form.destination,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          adults: form.adults,
          children: form.children,
        },
      });
      setPlan(res.data);
    } catch (err) {
      console.error('Failed to load holiday plan:', err);
    } finally {
      setPlanLoading(false);
    }
  }, [form.destination, form.checkIn, form.checkOut, form.adults, form.children]);

  function handleStep1Next() {
    setStep(2);
    fetchPlan();
  }

  function goBack(targetStep) {
    setStep(targetStep || step - 1);
  }

  function reset() {
    setStep(1);
    setForm({ destination: '', checkIn: isoDate(30), checkOut: isoDate(37), adults: 2, children: 0 });
    setPlan(null);
    setSelectedHotel(null);
    setSelectedFlight(null);
    setSelectedTransfer(null);
    setSelectedTours([]);
  }

  return (
    <div className="page">
      <h1 style={{ color: 'var(--aegean-blue)', marginBottom: '0.4rem', textAlign: 'center' }}>
        ✈️ Book My Holiday
      </h1>
      <p style={{ color: 'var(--warm-slate-500)', marginBottom: '2rem', textAlign: 'center' }}>
        AI-powered holiday planning — flight, hotel, transfer &amp; tours in one place
      </p>

      <StepBar current={step} />

      {planLoading && step > 1 && (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--warm-slate-500)', marginBottom: '1rem', fontSize: '0.88rem' }}>
          Loading your personalised holiday options…
        </div>
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {step === 1 && <Step1 form={form} setForm={setForm} onNext={handleStep1Next} />}
        {step === 2 && <Step2 form={form} selectedHotel={selectedHotel} setSelectedHotel={setSelectedHotel} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <Step3 form={form} plan={plan} selectedFlight={selectedFlight} setSelectedFlight={setSelectedFlight} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <Step4 form={form} plan={plan} selectedTransfer={selectedTransfer} setSelectedTransfer={setSelectedTransfer} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
        {step === 5 && <Step5 form={form} plan={plan} selectedTours={selectedTours} setSelectedTours={setSelectedTours} onNext={() => setStep(6)} onBack={() => setStep(4)} />}
        {step === 6 && (
          <Step6
            form={form}
            plan={plan}
            selectedHotel={selectedHotel}
            selectedFlight={selectedFlight}
            selectedTransfer={selectedTransfer}
            selectedTours={selectedTours}
            onBack={goBack}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}

export default HolidayPlanner;
