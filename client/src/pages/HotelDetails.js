import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function starsFromCode(code) {
  const n = Math.max(0, Math.min(parseInt(code, 10) || 0, 5));
  return '⭐'.repeat(n);
}

// ─── Photo Carousel ────────────────────────────────────────────────────────────

function PhotoCarousel({ images, hotelName, hotelCode }) {
  const [current, setCurrent] = useState(0);

  const photos = useMemo(() => {
    if (images && images.length > 0) {
      return images
        .map((img, i) =>
          img.path
            ? { src: `//photos.hotelbeds.com/giata/${img.path}`, alt: img.imageTypeCode || `${hotelName} photo ${i + 1}` }
            : null
        )
        .filter(Boolean)
        .slice(0, 12);
    }
    // Deterministic placeholders keyed by hotel code
    const labels = ['Exterior', 'Pool Area', 'Beach', 'Lobby', 'Restaurant', 'Rooms'];
    return labels.map((label, i) => ({
      src: `https://picsum.photos/seed/${hotelCode}-${i}/900/500`,
      alt: `${hotelName} – ${label}`,
    }));
  }, [images, hotelName, hotelCode]);

  const prev = () => setCurrent(c => (c - 1 + photos.length) % photos.length);
  const next = () => setCurrent(c => (c + 1) % photos.length);

  if (photos.length === 0) return null;

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', marginBottom: '0.25rem' }}>
      {/* Main image */}
      <div style={{ position: 'relative', height: 360, background: '#d0d0d0' }}>
        <img
          key={photos[current].src}
          src={photos[current].src}
          alt={photos[current].alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.currentTarget.src = `https://picsum.photos/seed/${hotelCode}-err/900/500`; }}
        />
        {/* Gradient overlay at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, background: 'linear-gradient(transparent, rgba(0,0,0,0.55))', pointerEvents: 'none' }} />

        {/* Caption */}
        <div style={{ position: 'absolute', bottom: 14, left: 16, color: 'white', fontSize: '0.82rem', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
          {photos[current].alt}
        </div>

        {/* Counter badge */}
        <div style={{ position: 'absolute', bottom: 14, right: 16, color: 'white', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(0,0,0,0.45)', padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
          {current + 1} / {photos.length}
        </div>

        {/* Prev / Next */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', borderRadius: '50%', width: 42, height: 42, fontSize: '1.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, transition: 'background 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; }}
            >‹</button>
            <button
              onClick={next}
              aria-label="Next photo"
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', borderRadius: '50%', width: 42, height: 42, fontSize: '1.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, transition: 'background 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; }}
            >›</button>
          </>
        )}
      </div>

      {/* Dot indicators + thumbnails */}
      {photos.length > 1 && (
        <div style={{ background: 'white', padding: '0.6rem 0.75rem 0.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Photo ${i + 1}: ${p.alt}`}
              style={{
                flex: '0 0 auto',
                width: 70, height: 48,
                border: i === current ? '2px solid var(--aegean-blue)' : '2px solid transparent',
                borderRadius: '6px',
                overflow: 'hidden',
                cursor: 'pointer',
                padding: 0,
                background: '#e0e0e0',
                opacity: i === current ? 1 : 0.65,
                transition: 'all 0.15s',
              }}
            >
              <img src={p.src} alt={p.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.currentTarget.src = `https://picsum.photos/seed/${hotelCode}-t${i}/70/48`; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Facility Tag ───────────────────────────────────────────────────────────────

function FacilityTag({ label }) {
  return (
    <span style={{
      background: 'rgba(31,111,175,0.08)',
      color: 'var(--aegean-blue)',
      padding: '0.25rem 0.65rem',
      borderRadius: '20px',
      fontSize: '0.78rem',
      fontWeight: 500,
    }}>
      {label}
    </span>
  );
}

// ─── Hotel AI Chat Widget ────────────────────────────────────────────────────────

function HotelChatWidget({ hotel }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `Merhaba! 👋 I'm your AI guide for **${hotel.name.content}**. Ask me about facilities, the children's pool, wheelchair accessibility, best nearby restaurants, or anything about this hotel and the surrounding area. I'll search the web for the latest information!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const stars = starsFromCode(hotel.categoryCode).length / 2;

  // Hotel context injected as the start of every conversation
  const buildHistory = (userInput) => {
    const hotelCtx = {
      role: 'user',
      content: `[Context] The user is viewing the hotel details page for: "${hotel.name.content}", a ${stars}-star hotel located in ${hotel.zoneName ? `${hotel.zoneName}, ` : ''}${hotel.destinationName}, Turkey. Hotel code: ${hotel.code}. Address: ${hotel.address ? hotel.address.content : 'N/A'}. Please answer all questions in the context of this hotel, and use the searchWeb and searchKnowledgeBase tools to find current, specific information.`,
    };
    const hotelAck = {
      role: 'assistant',
      content: `Understood! I have context for ${hotel.name.content} in ${hotel.destinationName}. I'll use web search to answer specific questions about this hotel's facilities, nearby dining, accessibility, and more. What would you like to know?`,
    };
    const priorMsgs = messages.slice(1).map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    }));
    return [hotelCtx, hotelAck, ...priorMsgs];
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setLoading(true);
    try {
      const history = buildHistory(userText);
      const res = await axios.post(`${API_BASE}/api/chat`, {
        message: userText,
        conversationHistory: history,
      });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.response }]);
    } catch (err) {
      const isServiceUnavailable = err.response?.status === 503;
      const isConfigError = isServiceUnavailable && err.response?.data?.configurationRequired;
      if (isConfigError) {
        console.warn('⚙️ Azure OpenAI is not configured:', err.response?.data?.configurationRequired);
      } else if (isServiceUnavailable) {
        console.warn('Chat API unavailable:', err.response?.data);
      }
      const errMsg = isServiceUnavailable
        ? "The AI assistant is currently unavailable. Please try again later."
        : "Sorry, I couldn't reach the AI agent right now. Please try again.";
      setMessages(prev => [...prev, { role: 'ai', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const hotelFirstWord = hotel.name.content.split(' ')[0];
  const suggestions = [
    `Does ${hotelFirstWord} have a children's pool?`,
    'Best restaurants nearby?',
    'Is this hotel wheelchair accessible?',
    'What facilities and amenities are available?',
    'What is the beach like?',
  ];

  return (
    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.1rem 1.5rem',
          background: 'linear-gradient(135deg, var(--aegean-blue) 0%, var(--azure-turquoise) 100%)',
          color: 'white', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
        }}
      >
        <span>🤖 Ask AI about this hotel & vicinity</span>
        <span style={{ fontSize: '0.9rem', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {open && (
        <div>
          {/* Chat history */}
          <div style={{ height: 300, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#fafbfc' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'ai' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--aegean-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, marginRight: '0.4rem', marginTop: '0.15rem' }}>
                    🤖
                  </div>
                )}
                <div style={{
                  maxWidth: '78%',
                  padding: '0.6rem 0.9rem',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? 'var(--aegean-blue)' : 'white',
                  color: m.role === 'user' ? 'white' : '#1a1a1a',
                  fontSize: '0.87rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--aegean-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>🤖</div>
                <div style={{ background: 'white', padding: '0.55rem 0.9rem', borderRadius: '14px', fontSize: '0.85rem', color: 'var(--warm-slate-500)', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  🔍 Searching for the latest information…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0.5rem 1.25rem 0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', background: '#fafbfc', borderTop: '1px solid #f0f0f0' }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  style={{
                    background: 'white', color: 'var(--aegean-blue)',
                    border: '1.5px solid rgba(31,111,175,0.25)',
                    borderRadius: '20px', padding: '0.3rem 0.75rem',
                    fontSize: '0.76rem', cursor: 'pointer', fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(31,111,175,0.06)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'white'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1.25rem', borderTop: '1px solid #f0f0f0', background: 'white' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Ask about ${hotel.name.content.split(' ').slice(0, 3).join(' ')}…`}
              style={{ flex: 1, padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '0.88rem', outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                padding: '0.65rem 1.1rem',
                background: 'var(--aegean-blue)', color: 'white',
                border: 'none', borderRadius: '8px',
                fontWeight: 700, fontSize: '0.88rem',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                opacity: input.trim() && !loading ? 1 : 0.55,
                transition: 'opacity 0.15s',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

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
      .then(res => setHotel(res.data.hotel))
      .catch(err => setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to load hotel details.'
      ))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8' }}>
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--aegean-blue) 0%, var(--azure-turquoise) 100%)',
        padding: '2.25rem 1.5rem 2.5rem',
        color: 'white',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Link
            to="/search"
            style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1rem' }}
          >
            ← Back to search
          </Link>
          <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.9rem', fontWeight: 700 }}>
            {loading ? 'Loading hotel…' : hotel ? hotel.name.content : 'Hotel Details'}
          </h1>
          {hotel && (
            <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>
              {starsFromCode(hotel.categoryCode)}{' '}
              {hotel.destinationName || ''}
              {hotel.zoneName ? ` · ${hotel.zoneName}` : ''}
            </p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--warm-slate-500)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
            <p>Loading hotel details…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ background: '#fff3f3', border: '1px solid #fecaca', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
            <Link to="/search" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1.25rem', background: 'var(--aegean-blue)', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              Back to Search
            </Link>
          </div>
        )}

        {/* Main content */}
        {!loading && hotel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Photo carousel */}
            <PhotoCarousel
              images={hotel.images}
              hotelName={hotel.name.content}
              hotelCode={String(hotel.code)}
            />

            {/* Info grid: hotel card + quick facts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

              {/* Main hotel card */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.25rem', color: 'var(--aegean-blue)', fontSize: '1.4rem' }}>
                      {hotel.name.content}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--warm-slate-500)', fontSize: '0.88rem' }}>
                      Hotel Code: <strong>{hotel.code}</strong>
                      {hotel.categoryName && <> · {hotel.categoryName.content}</>}
                    </p>
                  </div>
                  {hotel.categoryCode && (
                    <span style={{ background: '#fff7ed', color: '#c2410c', padding: '0.3rem 0.85rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {starsFromCode(hotel.categoryCode)}
                    </span>
                  )}
                </div>

                {/* Address */}
                {hotel.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <span>📍</span>
                    <p style={{ margin: 0, color: 'var(--warm-slate-700)', fontSize: '0.9rem' }}>
                      {[hotel.address.content, hotel.city?.content, hotel.postalCode, hotel.countryCode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {/* Coordinates */}
                {hotel.coordinates && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--warm-slate-500)', marginBottom: '0.6rem' }}>
                    🗺️ {hotel.coordinates.latitude}, {hotel.coordinates.longitude}
                    {' · '}
                    <a
                      href={`https://maps.google.com/?q=${hotel.coordinates.latitude},${hotel.coordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--aegean-blue)', fontWeight: 600 }}
                    >
                      View on Google Maps
                    </a>
                  </div>
                )}

                {/* Phone / Email */}
                {(hotel.phones || hotel.email) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
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
              </div>
            </div>

            {/* Description */}
            {hotel.description && hotel.description.content && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <h3 style={{ color: 'var(--aegean-blue)', marginTop: 0, marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                  📖 About this hotel
                </h3>
                <p style={{ color: 'var(--warm-slate-700)', lineHeight: 1.75, margin: 0, fontSize: '0.95rem' }}>
                  {hotel.description.content}
                </p>
              </div>
            )}

            {/* Check-in / Check-out */}
            {(hotel.checkIn || hotel.checkOut) && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <h3 style={{ color: 'var(--aegean-blue)', marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>🕐 Check-in / Check-out</h3>
                <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                  {hotel.checkIn && (
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--warm-slate-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Check-in from</div>
                      <div style={{ fontWeight: 700, color: 'var(--aegean-blue)', fontSize: '1.2rem' }}>{hotel.checkIn.minTime || '—'}</div>
                    </div>
                  )}
                  {hotel.checkOut && (
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--warm-slate-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Check-out by</div>
                      <div style={{ fontWeight: 700, color: 'var(--aegean-blue)', fontSize: '1.2rem' }}>{hotel.checkOut.maxTime || '—'}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Facilities */}
            {hotel.facilities && hotel.facilities.length > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <h3 style={{ color: 'var(--aegean-blue)', marginTop: 0, marginBottom: '0.75rem', fontSize: '1.1rem' }}>🏊 Facilities & Amenities</h3>
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

            {/* AI Chat Widget */}
            <HotelChatWidget hotel={hotel} />

            {/* Back CTA */}
            <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
              <Link
                to="/search"
                style={{ display: 'inline-block', padding: '0.75rem 2.25rem', background: 'var(--aegean-blue)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}
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
