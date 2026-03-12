import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

const DESTINATIONS = ['Bodrum', 'Antalya', 'Cappadocia', 'Marmaris', 'Fethiye', 'Istanbul', 'Kusadasi', 'Izmir'];
const CATEGORIES = ['All', 'Resorts & Hotels', 'Excursions', 'Holiday Packages', 'Transfers'];

const QUICK_SEARCHES = [
  { label: 'Beach resorts Bodrum', icon: '🏖️' },
  { label: 'Luxury spa Antalya', icon: '💆' },
  { label: 'Hot air balloon Cappadocia', icon: '🎈' },
  { label: 'Family hotel Marmaris', icon: '👨‍👩‍👧‍👦' },
  { label: 'Cooking class Istanbul', icon: '🍽️' },
  { label: 'All-inclusive packages', icon: '✈️' },
];

function SearchResultCard({ result, category }) {
  const isExcursion = result.type && result.price_from;
  const isPackage = result.price_from_pp;

  if (isPackage) {
    return (
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0', transition: 'all 0.2s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{result.image_placeholder || '✈️'}</span>
          <span style={{ background: 'var(--azure-turquoise)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>Package</span>
        </div>
        <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.3rem', fontSize: '1rem' }}>{result.name}</h3>
        <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          {result.destination} · {result.duration_nights} nights · {result.board_basis} · {'⭐'.repeat(result.star_rating)}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--aegean-blue)', fontWeight: 700, fontSize: '1.05rem' }}>
            From £{result.price_from_pp.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--warm-slate-500)' }}>pp</span>
          </span>
          <Link to={`/services`} style={{ color: 'var(--aegean-blue)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>View →</Link>
        </div>
      </div>
    );
  }

  if (isExcursion) {
    return (
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{ background: '#fff3cd', color: '#856404', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{result.type}</span>
          <span style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem' }}>{result.duration}</span>
        </div>
        <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.25rem', fontSize: '1rem' }}>{result.name}</h3>
        <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{result.destination} · {result.difficulty}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--aegean-blue)', fontWeight: 700 }}>From €{result.price_from}</span>
          <Link to="/services" style={{ color: 'var(--aegean-blue)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>Book →</Link>
        </div>
      </div>
    );
  }

  // Resort card
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <span style={{ color: '#f6ad55', fontSize: '0.9rem' }}>{'⭐'.repeat(result.star_rating || 0)}</span>
        {result.score && <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{Math.round((result.score || 0) * 100)}% match</span>}
      </div>
      <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.25rem', fontSize: '1rem' }}>{result.resort_name || result.name}</h3>
      <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem', marginBottom: '0.75rem', lineHeight: 1.4 }}>{result.region || result.destination_name} · {(result.description || '').slice(0, 80)}{result.description?.length > 80 ? '…' : ''}</p>
      {result.vibe_tags && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
          {(result.vibe_tags || []).slice(0, 3).map(t => (
            <span key={t} style={{ background: 'rgba(31,111,175,0.08)', color: 'var(--aegean-blue)', padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.72rem' }}>{t}</span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {result.id && <Link to={`/resorts/${result.id}/deep-dive`} style={{ flex: 1, textAlign: 'center', padding: '0.45rem', background: 'var(--aegean-blue)', color: 'white', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>AI Deep Dive</Link>}
        <Link to="/destinations" style={{ flex: 1, textAlign: 'center', padding: '0.45rem', border: '1px solid var(--aegean-blue)', color: 'var(--aegean-blue)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>Explore</Link>
      </div>
    </div>
  );
}

function SearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [destination, setDestination] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const runSearch = useCallback(async (searchQuery, searchCategory, searchDest) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const allResults = [];

      // Resorts / Hotels
      if (searchCategory === 'All' || searchCategory === 'Resorts & Hotels') {
        try {
          const res = await axios.post(`${API_BASE}/api/search`, {
            query: searchQuery,
            filters: searchDest ? { region: searchDest } : {},
          });
          allResults.push(...(res.data.results || []).map(r => ({ ...r, _source: 'resort' })));
        } catch (resortErr) {
          console.warn('Resort search unavailable:', resortErr.message);
        }
      }

      // Excursions
      if (searchCategory === 'All' || searchCategory === 'Excursions') {
        try {
          const res = await axios.get(`${API_BASE}/api/services/excursions`, {
            params: { destination: searchDest || undefined },
          });
          const q = searchQuery.toLowerCase();
          const excursions = (res.data.excursions || []).filter(e =>
            e.name.toLowerCase().includes(q) ||
            e.type.toLowerCase().includes(q) ||
            e.destination.toLowerCase().includes(q) ||
            q.includes(e.destination.toLowerCase())
          );
          allResults.push(...excursions.map(e => ({ ...e, _source: 'excursion' })));
        } catch (excErr) {
          console.warn('Excursion search unavailable:', excErr.message);
        }
      }

      // Packages
      if (searchCategory === 'All' || searchCategory === 'Holiday Packages') {
        try {
          const res = await axios.get(`${API_BASE}/api/services/packages`, {
            params: { destination: searchDest || undefined },
          });
          const q = searchQuery.toLowerCase();
          const packages = (res.data.packages || []).filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.destination.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            q.includes(p.destination.toLowerCase())
          );
          allResults.push(...packages.map(p => ({ ...p, _source: 'package' })));
        } catch (pkgErr) {
          console.warn('Package search unavailable:', pkgErr.message);
        }
      }

      setResults(allResults);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    runSearch(query, category, destination);
  }

  function handleQuickSearch(label) {
    setQuery(label);
    runSearch(label, 'All', '');
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Search Bar */}
      <div style={{ background: 'linear-gradient(135deg, var(--aegean-blue) 0%, var(--azure-turquoise) 100%)', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            🇹🇷 Search Türkiye Travel
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '1.75rem', fontSize: '1.05rem' }}>
            Resorts, excursions, packages, and transfers — all in one place
          </p>

          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. 'luxury beach hotel Bodrum' or 'hot air balloon'"
                style={{ flex: 2, minWidth: 200, padding: '0.85rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.95rem', outline: 'none' }}
              />
              <select
                value={destination}
                onChange={e => setDestination(e.target.value)}
                style={{ flex: 1, minWidth: 130, padding: '0.85rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                <option value="">All Destinations</option>
                {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                style={{ padding: '0.85rem 1.5rem', background: 'white', color: 'var(--aegean-blue)', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: query.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}
              >
                {loading ? '⏳' : '🔍 Search'}
              </button>
            </div>

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  style={{
                    padding: '0.4rem 0.9rem', borderRadius: '20px', border: '1.5px solid',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                    borderColor: category === c ? 'white' : 'rgba(255,255,255,0.5)',
                    background: category === c ? 'white' : 'transparent',
                    color: category === c ? 'var(--aegean-blue)' : 'white',
                    transition: 'all 0.15s',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Quick Search Suggestions */}
        {!searched && (
          <>
            <h2 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
              Popular Searches
            </h2>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              {QUICK_SEARCHES.map(qs => (
                <button
                  key={qs.label}
                  onClick={() => handleQuickSearch(qs.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1rem', background: 'white', border: '1.5px solid var(--warm-sand)',
                    borderRadius: '24px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                    color: 'var(--warm-slate-700)', transition: 'all 0.15s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--aegean-blue)'; e.currentTarget.style.color = 'var(--aegean-blue)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--warm-sand)'; e.currentTarget.style.color = 'var(--warm-slate-700)'; }}
                >
                  <span>{qs.icon}</span> {qs.label}
                </button>
              ))}
            </div>

            {/* Feature Links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { title: 'Resorts', icon: '🏨', desc: 'Find your perfect hotel', href: '/destinations' },
                { title: 'Excursions', icon: '🎒', desc: 'Day trips & experiences', href: '/services' },
                { title: 'Packages', icon: '✈️', desc: 'All-inclusive deals', href: '/services' },
                { title: 'AI Deep Dive', icon: '🤖', desc: 'Resort intelligence', href: '/destinations' },
              ].map(f => (
                <Link
                  key={f.title}
                  to={f.href}
                  style={{ textDecoration: 'none', background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', display: 'block', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(31,111,175,0.12)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, color: 'var(--aegean-blue)', marginBottom: '0.25rem' }}>{f.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--warm-slate-500)' }}>{f.desc}</div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
            <p style={{ color: 'var(--warm-slate-500)' }}>Searching Türkiye travel options…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '8px', padding: '1rem', color: '#c53030', marginBottom: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ color: 'var(--aegean-blue)', fontSize: '1.1rem', fontWeight: 600 }}>
                {results.length > 0 ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"` : `No results for "${query}"`}
              </h2>
              {results.length > 0 && (
                <Link to="/chat" style={{ color: 'var(--aegean-blue)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                  🤖 Ask AI Agent →
                </Link>
              )}
            </div>

            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>No matching results</h3>
                <p style={{ color: 'var(--warm-slate-500)', marginBottom: '1.5rem' }}>Try a different search term, or ask the AI agent for personalised recommendations.</p>
                <Link to="/chat" style={{ padding: '0.7rem 1.5rem', background: 'var(--aegean-blue)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                  Ask TürkiyeAI →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {results.map((r, i) => (
                  <SearchResultCard key={r.id || i} result={r} category={category} />
                ))}
              </div>
            )}

            {/* AI CTA */}
            <div style={{ background: 'linear-gradient(135deg, var(--aegean-blue) 0%, var(--azure-turquoise) 100%)', borderRadius: '12px', padding: '1.5rem 2rem', marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ color: 'white', margin: '0 0 0.25rem', fontSize: '1.05rem' }}>Not quite what you're looking for?</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.875rem' }}>TürkiyeAI's smart agent can help plan your perfect Türkiye trip.</p>
              </div>
              <Link to="/chat" style={{ padding: '0.7rem 1.5rem', background: 'white', color: 'var(--aegean-blue)', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                🤖 Ask the AI Agent
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
