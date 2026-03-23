import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

function FacilityTag({ label }) {
  return (
    <span style={{
      background: 'rgba(31,111,175,0.08)',
      color: 'var(--aegean-blue)',
      padding: '0.2rem 0.6rem',
      borderRadius: '20px',
      fontSize: '0.78rem',
      fontWeight: 500,
    }}>
      {label}
    </span>
  );
}

export default function HotelDetails() {
  const { code } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError('');
    axios.get(`${API_BASE}/api/hotels/${code}`)
      .then(res => {
        setHotel(res.data.hotel);
      })
      .catch(err => {
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to load hotel details.'
        );
      })
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--aegean-blue) 0%, var(--azure-turquoise) 100%)',
        padding: '2.5rem 1.5rem',
        color: 'white',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Link
            to="/search"
            style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
          >
            ← Back to search
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>
            {loading ? 'Loading hotel…' : hotel ? hotel.name.content : 'Hotel Details'}
          </h1>
          {hotel && (
            <p style={{ margin: '0.4rem 0 0', opacity: 0.85, fontSize: '0.95rem' }}>
              {(() => {
                const raw = parseInt(hotel.categoryCode, 10);
                return '⭐'.repeat(isNaN(raw) ? 0 : Math.max(0, Math.min(raw, 5)));
              })()}{' '}
              {hotel.destinationName || ''}{hotel.zoneName ? ` · ${hotel.zoneName}` : ''}
            </p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1.5rem' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--warm-slate-500)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
            <p>Loading hotel details…</p>
          </div>
        )}

        {!loading && error && (
          <div style={{
            background: '#fff3f3',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            color: '#dc2626',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
            <Link
              to="/search"
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                padding: '0.5rem 1.25rem',
                background: 'var(--aegean-blue)',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              Back to Search
            </Link>
          </div>
        )}

        {!loading && hotel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Main card */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.3rem', color: 'var(--aegean-blue)', fontSize: '1.4rem' }}>
                    {hotel.name.content}
                  </h2>
                  <p style={{ margin: 0, color: 'var(--warm-slate-500)', fontSize: '0.9rem' }}>
                    Hotel Code: <strong>{hotel.code}</strong>
                    {hotel.categoryName && <> · {hotel.categoryName.content}</>}
                  </p>
                </div>
                {hotel.categoryCode && (
                  <span style={{
                    background: '#fff7ed',
                    color: '#c2410c',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}>
                    {(() => {
                      const raw = parseInt(hotel.categoryCode, 10);
                      return '⭐'.repeat(isNaN(raw) ? 0 : Math.max(0, Math.min(raw, 5)));
                    })()}
                  </span>
                )}
              </div>

              {/* Address */}
              {hotel.address && (
                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span>📍</span>
                  <div>
                    <p style={{ margin: 0, color: 'var(--warm-slate-700)', fontSize: '0.9rem' }}>
                      {[hotel.address.content, hotel.city?.content, hotel.postalCode, hotel.countryCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Phone / Email */}
              {(hotel.phones || hotel.email) && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {hotel.phones && hotel.phones.length > 0 && (
                    <span style={{ fontSize: '0.88rem', color: 'var(--warm-slate-500)' }}>
                      📞 {hotel.phones[0].phoneNumber}
                    </span>
                  )}
                  {hotel.email && (
                    <span style={{ fontSize: '0.88rem', color: 'var(--warm-slate-500)' }}>
                      ✉️ {hotel.email}
                    </span>
                  )}
                </div>
              )}

              {/* Coordinates */}
              {hotel.coordinates && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--warm-slate-500)' }}>
                  🗺️ {hotel.coordinates.latitude}, {hotel.coordinates.longitude}
                  {' · '}
                  <a
                    href={`https://maps.google.com/?q=${hotel.coordinates.latitude},${hotel.coordinates.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--aegean-blue)', fontWeight: 600 }}
                  >
                    View on map
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            {hotel.description && hotel.description.content && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <h3 style={{ color: 'var(--aegean-blue)', marginTop: 0, fontSize: '1.1rem' }}>About this hotel</h3>
                <p style={{ color: 'var(--warm-slate-700)', lineHeight: 1.7, margin: 0, fontSize: '0.95rem' }}>
                  {hotel.description.content}
                </p>
              </div>
            )}

            {/* Facilities */}
            {hotel.facilities && hotel.facilities.length > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <h3 style={{ color: 'var(--aegean-blue)', marginTop: 0, fontSize: '1.1rem' }}>Facilities & Amenities</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {hotel.facilities.slice(0, 40).map((f, i) => (
                    <FacilityTag key={i} label={f.facilityName?.content || f.facilityCode} />
                  ))}
                  {hotel.facilities.length > 40 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--warm-slate-500)', alignSelf: 'center' }}>
                      +{hotel.facilities.length - 40} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Images */}
            {hotel.images && hotel.images.length > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <h3 style={{ color: 'var(--aegean-blue)', marginTop: 0, fontSize: '1.1rem' }}>Photos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {hotel.images.slice(0, 12).map((img, i) => {
                    const src = img.path
                      ? `//photos.hotelbeds.com/giata/${img.path}`
                      : null;
                    if (!src) return null;
                    return (
                      <img
                        key={i}
                        src={src}
                        alt={img.imageTypeCode || `Hotel photo ${i + 1}`}
                        style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: '8px', background: '#f0f0f0' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Check-in / Check-out times */}
            {(hotel.checkIn || hotel.checkOut) && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <h3 style={{ color: 'var(--aegean-blue)', marginTop: 0, fontSize: '1.1rem' }}>Check-in / Check-out</h3>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  {hotel.checkIn && (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--warm-slate-500)', marginBottom: '0.2rem' }}>Check-in from</div>
                      <div style={{ fontWeight: 700, color: 'var(--aegean-blue)', fontSize: '1.1rem' }}>
                        {hotel.checkIn.minTime || '—'}
                      </div>
                    </div>
                  )}
                  {hotel.checkOut && (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--warm-slate-500)', marginBottom: '0.2rem' }}>Check-out by</div>
                      <div style={{ fontWeight: 700, color: 'var(--aegean-blue)', fontSize: '1.1rem' }}>
                        {hotel.checkOut.maxTime || '—'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
              <Link
                to="/search"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 2rem',
                  background: 'var(--aegean-blue)',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                ← Back to Search
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
