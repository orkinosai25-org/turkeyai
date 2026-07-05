import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdBanner from '../components/AdBanner';

const API_BASE = process.env.REACT_APP_API_URL || '';

const DESTINATIONS = ['Bodrum', 'Antalya', 'Cappadocia', 'Marmaris', 'Fethiye', 'Istanbul', 'Kusadasi', 'Izmir'];
const CATEGORIES = ['All', 'Resorts & Hotels', 'Excursions', 'Holiday Packages', 'Transfers', 'Cars', 'Flights'];

// HotelBeds destination codes for popular Turkish destinations
// Obtain full list via GET /hotel-content-api/1.0/locations/destinations
const HOTELBEDS_DEST_CODES = {
  Bodrum: 'BOD',
  Antalya: 'ANT',
  Istanbul: 'IST',
  Marmaris: 'MAR',
  Fethiye: 'FET',
  Kusadasi: 'KUS',
  Izmir: 'IZM',
  Cappadocia: 'CAP',
};

// Default check-in / check-out helpers (today + 7 days and today + 14 days)
function isoDate(daysFromNow = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

// Pre-built word-boundary regexes for each destination to avoid repeated computation
const DESTINATION_PATTERNS = DESTINATIONS.reduce((map, dest) => {
  map[dest] = new RegExp(`\\b${dest}\\b`, 'i');
  return map;
}, {});

/**
 * Detect a known Turkish destination mentioned in a free-text query.
 * Uses word-boundary matching to avoid false positives (e.g. a query
 * containing "Istanbul" should not match a hypothetical destination "Stan").
 * Returns the matching destination name or an empty string if none found.
 */
function detectDestinationFromText(text) {
  return DESTINATIONS.find(d => DESTINATION_PATTERNS[d].test(text)) || '';
}

const QUICK_SEARCHES = [
  { label: 'Beach resorts Bodrum', icon: '🏖️' },
  { label: 'Luxury spa Antalya', icon: '💆' },
  { label: 'Hot air balloon Cappadocia', icon: '🎈' },
  { label: 'Family hotel Marmaris', icon: '👨‍👩‍👧‍👦' },
  { label: 'Cooking class Istanbul', icon: '🍽️' },
  { label: 'All-inclusive packages', icon: '✈️' },
  { label: 'Car hire Antalya', icon: '🚗' },
  { label: 'Airport transfer Bodrum', icon: '🚌' },
  { label: 'Flights to Istanbul', icon: '🛫' },
];

function CarResultCard({ result }) {
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{result.icon || '🚗'}</span>
        <span style={{ background: '#e8f0fe', color: '#1a56db', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>Car Hire</span>
      </div>
      <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.25rem', fontSize: '1rem' }}>{result.category}</h3>
      <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
        {result.example_model} · {result.seats} seats · {result.transmission} · {result.ac ? 'A/C' : 'No A/C'}
      </p>
      <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
        ✈️ {(result.available_airports || []).join(', ')}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--aegean-blue)', fontWeight: 700 }}>
          From €{result.price_from_per_day_eur}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--warm-slate-500)' }}>/day</span>
        </span>
        <Link to="/services" style={{ color: 'var(--aegean-blue)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>View →</Link>
      </div>
    </div>
  );
}

function TransferResultCard({ result }) {
  const cheapestVehicle = (result.vehicles || []).reduce((min, v) => (!min || v.price_eur < min.price_eur ? v : min), null);
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🚌</span>
        <span style={{ background: '#f0fdf4', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>Transfer</span>
      </div>
      <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.25rem', fontSize: '1rem' }}>
        {result.from} → {result.destination}
      </h3>
      <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
        {result.distance_km} km · {(result.vehicles || []).length} vehicle options
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {cheapestVehicle && (
          <span style={{ color: 'var(--aegean-blue)', fontWeight: 700 }}>
            From €{cheapestVehicle.price_eur}
          </span>
        )}
        <Link to="/services" style={{ color: 'var(--aegean-blue)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>View →</Link>
      </div>
    </div>
  );
}

function FlightRouteCard({ result }) {
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>✈️</span>
        <span style={{ background: '#fff7ed', color: '#c2410c', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>Flight Route</span>
      </div>
      <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.25rem', fontSize: '1rem' }}>
        {result.from} → {result.to}
      </h3>
      <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
        ⏱ {result.approx_flight_time}
      </p>
      <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
        {(result.airlines || []).join(' · ')}
      </p>
      <Link to="/services" style={{ color: 'var(--aegean-blue)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>View details →</Link>
    </div>
  );
}

function HotelAvailabilityCard({ result }) {
  const minRateNum = parseFloat(result.minRate);
  const minRate = !isNaN(minRateNum)
    ? `${result.currency || ''} ${minRateNum.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;
  const starsRaw = result.categoryCode ? parseInt(result.categoryCode, 10) : parseInt(result.stars, 10);
  const stars = isNaN(starsRaw) ? 0 : Math.max(0, Math.min(starsRaw, 5));
  const isLive = result._dataSource === 'hotelbeds';
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <span style={{ color: '#f6ad55', fontSize: '0.9rem' }}>{'⭐'.repeat(stars)}</span>
        <span style={{
          background: isLive ? '#e8f5e9' : '#fff8e1',
          color: isLive ? '#2e7d32' : '#b45309',
          padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600
        }}>
          {isLive ? '🟢 Live API' : '📋 Demo Data'}
        </span>
      </div>
      <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.2rem', fontSize: '1rem' }}>{result.name}</h3>
      <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
        {result.destinationName || result.zoneName || ''}{result.address ? ` · ${result.address}` : ''}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {minRate && (
          <span style={{ color: 'var(--aegean-blue)', fontWeight: 700, fontSize: '1rem' }}>
            From {minRate}
          </span>
        )}
        <Link
          to={`/hotels/${result.code}`}
          style={{ color: 'var(--aegean-blue)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', border: '1px solid var(--aegean-blue)', padding: '0.3rem 0.7rem', borderRadius: '6px' }}
        >
          View details →
        </Link>
      </div>
    </div>
  );
}

function SearchResultCard({ result, category }) {
  if (result._source === 'car') return <CarResultCard result={result} />;
  if (result._source === 'transfer') return <TransferResultCard result={result} />;
  if (result._source === 'flight') return <FlightRouteCard result={result} />;
  if (result._source === 'hotelbeds') return <HotelAvailabilityCard result={result} />;

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
        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          {result._isMockData && (
            <span style={{ background: '#fff3e0', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>📋 Sample</span>
          )}
          {result.score && <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{Math.round((result.score || 0) * 100)}% match</span>}
        </div>
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
  const [hotelCount, setHotelCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [hotelDataSource, setHotelDataSource] = useState(null);  // 'hotelbeds' (HotelBeds API) | 'static' (demo fallback) | null
  const [resortsMock, setResortsMock] = useState(false);

  // HotelBeds hotel availability search fields
  const [checkIn, setCheckIn] = useState(isoDate(7));
  const [checkOut, setCheckOut] = useState(isoDate(14));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  const runSearch = useCallback(async (searchQuery, searchCategory, searchDest, hotelParams) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    setHotelCount(0);
    setHotelDataSource(null);
    setResortsMock(false);

    try {
      const allResults = [];

      // Resorts / Hotels
      if (searchCategory === 'All' || searchCategory === 'Resorts & Hotels') {
        try {
          const res = await axios.post(`${API_BASE}/api/search`, {
            query: searchQuery,
            filters: searchDest ? { region: searchDest } : {},
          });
          const isMock = !!(res.data.note);
          setResortsMock(isMock);
          allResults.push(...(res.data.results || []).map(r => ({ ...r, _source: 'resort', _isMockData: isMock })));
        } catch (resortErr) {
          console.warn('Resort search unavailable:', resortErr.message);
        }

        // Hotel search by destination (works even without HotelBeds credentials)
        const hotelDest = searchDest || detectDestinationFromText(searchQuery);
        if (hotelDest) {
          try {
            const hsRes = await axios.get(`${API_BASE}/api/hotels/search`, {
              params: { destination: hotelDest },
            });
            const hsSource = hsRes.data.source || 'static';
            setHotelDataSource(hsSource);
            const hotelResults = (hsRes.data.hotels || []).map(h => ({ ...h, _source: 'hotelbeds', _dataSource: hsSource }));
            allResults.push(...hotelResults);
          } catch (hsErr) {
            console.warn('Hotel search unavailable:', hsErr.message);
          }
        }

        // HotelBeds live availability
        if (hotelParams && hotelParams.destCode && hotelParams.checkIn && hotelParams.checkOut) {
          try {
            const hbRes = await axios.post(`${API_BASE}/api/hotels/availability`, {
              destination: hotelParams.destCode,
              checkIn: hotelParams.checkIn,
              checkOut: hotelParams.checkOut,
              adults: hotelParams.adults,
              children: hotelParams.children,
              rooms: hotelParams.rooms,
            });
            // Deduplicate: skip hotels already returned by search endpoint
            const existingCodes = new Set(allResults.filter(r => r._source === 'hotelbeds').map(r => String(r.code)));
            const liveHotels = (hbRes.data.hotels || [])
              .filter(h => !existingCodes.has(String(h.code)))
              .map(h => ({ ...h, _source: 'hotelbeds', _dataSource: 'hotelbeds' }));
            allResults.push(...liveHotels);
          } catch (hbErr) {
            console.warn('HotelBeds availability unavailable:', hbErr.message);
          }
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

      // Transfers
      if (searchCategory === 'All' || searchCategory === 'Transfers') {
        try {
          const res = await axios.get(`${API_BASE}/api/services/transfers`, {
            params: searchDest ? { destination: searchDest } : {},
          });
          const q = searchQuery.toLowerCase();
          const transfers = (res.data.transfers || []).filter(t =>
            t.from.toLowerCase().includes(q) ||
            t.destination.toLowerCase().includes(q) ||
            q.includes('transfer') || q.includes('airport')
          );
          allResults.push(...transfers.map(t => ({ ...t, _source: 'transfer' })));
        } catch (tErr) {
          console.warn('Transfer search unavailable:', tErr.message);
        }
      }

      // Cars
      if (searchCategory === 'All' || searchCategory === 'Cars') {
        try {
          const res = await axios.get(`${API_BASE}/api/services/cars`);
          const q = searchQuery.toLowerCase();
          const cars = (res.data.cars || []).filter(c =>
            c.category.toLowerCase().includes(q) ||
            c.example_model.toLowerCase().includes(q) ||
            q.includes('car') || q.includes('hire') || q.includes('rental') || q.includes('rent')
          );
          allResults.push(...cars.map(c => ({ ...c, _source: 'car' })));
        } catch (carErr) {
          console.warn('Car search unavailable:', carErr.message);
        }
      }

      // Flights
      if (searchCategory === 'All' || searchCategory === 'Flights') {
        try {
          const res = await axios.get(`${API_BASE}/api/services/flights`);
          const q = searchQuery.toLowerCase();
          const routes = (res.data.popular_uk_routes || []).filter(r =>
            r.from.toLowerCase().includes(q) ||
            r.to.toLowerCase().includes(q) ||
            (r.airlines || []).some(a => a.toLowerCase().includes(q)) ||
            q.includes('flight') || q.includes('fly')
          );
          allResults.push(...routes.map((r, idx) => ({ ...r, _source: 'flight', id: `flight-${idx}-${r.from}-${r.to}` })));
        } catch (flightErr) {
          console.warn('Flight search unavailable:', flightErr.message);
        }
      }

      setResults(allResults);
      setHotelCount(allResults.filter(r => r._source === 'hotelbeds').length);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    // If no destination selected from dropdown, try to detect it from the query text
    const resolvedDest = destination || detectDestinationFromText(query);
    const destCode = resolvedDest ? HOTELBEDS_DEST_CODES[resolvedDest] : null;
    const hotelParams = destCode ? { destCode, checkIn, checkOut, adults, children, rooms } : null;
    runSearch(query, category, resolvedDest, hotelParams);
  }

  function handleQuickSearch(label) {
    setQuery(label);
    const resolvedDest = detectDestinationFromText(label);
    const destCode = resolvedDest ? HOTELBEDS_DEST_CODES[resolvedDest] : null;
    const hotelParams = destCode ? { destCode, checkIn, checkOut, adults, children, rooms } : null;
    runSearch(label, 'All', resolvedDest, hotelParams);
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Search Bar */}
      <div style={{ background: 'linear-gradient(135deg, var(--aegean-blue) 0%, var(--azure-turquoise) 100%)', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            🇹🇷 Search Turkey Travel
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

            {/* Hotel date/guest fields — visible for Resorts & Hotels or All */}
            {(category === 'Resorts & Hotels' || category === 'All') && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 600 }}>Check-in</span>
                  <input
                    type="date"
                    value={checkIn}
                    min={isoDate(1)}
                    onChange={e => setCheckIn(e.target.value)}
                    style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.9rem', outline: 'none' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 600 }}>Check-out</span>
                  <input
                    type="date"
                    value={checkOut}
                    min={isoDate(2)}
                    onChange={e => setCheckOut(e.target.value)}
                    style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.9rem', outline: 'none' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 600 }}>Adults</span>
                  <input
                    type="number"
                    value={adults}
                    min={1}
                    max={20}
                    onChange={e => setAdults(parseInt(e.target.value, 10) || 1)}
                    style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.9rem', outline: 'none', width: 70 }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 600 }}>Children</span>
                  <input
                    type="number"
                    value={children}
                    min={0}
                    max={10}
                    onChange={e => setChildren(parseInt(e.target.value, 10) || 0)}
                    style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.9rem', outline: 'none', width: 70 }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 600 }}>Rooms</span>
                  <input
                    type="number"
                    value={rooms}
                    min={1}
                    max={10}
                    onChange={e => setRooms(parseInt(e.target.value, 10) || 1)}
                    style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.9rem', outline: 'none', width: 70 }}
                  />
                </label>
              </div>
            )}
          </form>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Ad banner above search results area */}
        <AdBanner zone="search_top" style={{ marginBottom: '0.5rem' }} />

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
                { title: 'Cars', icon: '🚗', desc: 'Car hire at airports', href: '/services' },
                { title: 'Transfers', icon: '🚌', desc: 'Airport transfers', href: '/services' },
                { title: 'Flights', icon: '🛫', desc: 'UK to Turkey routes', href: '/services' },
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
            <p style={{ color: 'var(--warm-slate-500)' }}>Searching Turkey travel options…</p>
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
              <div>
                <h2 style={{ color: 'var(--aegean-blue)', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.2rem' }}>
                  {results.length > 0 ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"` : `No results for "${query}"`}
                </h2>
                {hotelCount > 0 && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--warm-slate-500)' }}>
                    🏨 {hotelCount} hotel{hotelCount !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
              {results.length > 0 && (
                <Link to="/chat" style={{ color: 'var(--aegean-blue)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                  🤖 Ask AI Agent →
                </Link>
              )}
            </div>

            {results.length > 0 && (hotelDataSource || resortsMock) && (
              <div style={{ background: hotelDataSource === 'hotelbeds' ? '#f0fdf4' : '#fffbeb', border: `1px solid ${hotelDataSource === 'hotelbeds' ? '#86efac' : '#fcd34d'}`, borderRadius: '8px', padding: '0.6rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: hotelDataSource === 'hotelbeds' ? '#15803d' : '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {hotelDataSource === 'hotelbeds'
                  ? '🟢 Hotel data: Live HotelBeds API'
                  : hotelDataSource === 'static'
                  ? '📋 Hotel data: Demo/static fallback — configure HotelBeds API for live results'
                  : null}
                {resortsMock && (
                  <span style={{ marginLeft: hotelDataSource ? '0.75rem' : 0 }}>
                    📋 Resort data: Sample fallback — configure Azure AI Search for live results
                  </span>
                )}
              </div>
            )}

            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>No matching results</h3>
                <p style={{ color: 'var(--warm-slate-500)', marginBottom: '1.5rem' }}>Try a different search term, or ask the AI agent for personalised recommendations.</p>
                <Link to="/chat" style={{ padding: '0.7rem 1.5rem', background: 'var(--aegean-blue)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                  Ask TurkiyAI Holidays →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 280px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {results.map((r, i) => (
                    <SearchResultCard key={r.code || r.id || `result-${i}`} result={r} category={category} />
                  ))}
                </div>
                {/* Sidebar ad – only shows when there is content for this zone */}
                <div style={{ width: 300, flexShrink: 0, minWidth: 0 }}>
                  <AdBanner zone="search_sidebar" label={true} />
                </div>
              </div>
            )}

            {/* AI CTA */}
            <div style={{ background: 'linear-gradient(135deg, var(--aegean-blue) 0%, var(--azure-turquoise) 100%)', borderRadius: '12px', padding: '1.5rem 2rem', marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ color: 'white', margin: '0 0 0.25rem', fontSize: '1.05rem' }}>Not quite what you're looking for?</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.875rem' }}>TurkiyAI Holidays' smart agent can help plan your perfect Turkey trip.</p>
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
