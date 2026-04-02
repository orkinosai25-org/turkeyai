import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '';

const BLANK_FORM = {
  zone: 'header_banner',
  ad_type: 'text',
  title: '',
  body_text: '',
  image_url: '',
  link_url: '',
  alt_text: '',
  advertiser_name: '',
  advertiser_email: '',
  advertiser_phone: '',
  package_type: 'bronze',
  is_active: true,
  display_order: 0,
  start_date: '',
  end_date: '',
};

const PACKAGE_COLOURS = {
  bronze: '#b45309',
  silver: '#6b7280',
  gold: '#d97706',
  platinum: '#7c3aed',
};

const PACKAGE_ICONS = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };

const AD_TYPE_LABELS = { image: '🖼️ Image', text: '📝 Text', html: '🌐 HTML' };

// Quick-duration options shown as buttons on the booking form
const QUICK_DURATIONS = [
  { label: '1 Week',    days: 7   },
  { label: '2 Weeks',   days: 14  },
  { label: '1 Month',   days: 30  },
  { label: '3 Months',  days: 90  },
  { label: '6 Months',  days: 180 },
  { label: '12 Months', days: 365 },
];

/** Return today's date as YYYY-MM-DD */
function today() {
  return new Date().toISOString().split('T')[0];
}

/** Add days to a YYYY-MM-DD string and return YYYY-MM-DD */
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Format a YYYY-MM-DD string as "DD Mon YYYY" */
function fmtDate(str) {
  if (!str) return '—';
  try {
    return new Date(str + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return str;
  }
}

function AdManager() {
  const [ads, setAds] = useState([]);
  const [zones, setZones] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [feedback, setFeedback] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterZone, setFilterZone] = useState('');

  const showFeedback = useCallback((msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [adsRes, zonesRes, pkgRes] = await Promise.all([
        fetch(`${API_BASE}/api/ads`),
        fetch(`${API_BASE}/api/ads/zones`),
        fetch(`${API_BASE}/api/ads/packages`),
      ]);
      const adsData = adsRes.ok ? await adsRes.json() : { ads: [] };
      const zonesData = zonesRes.ok ? await zonesRes.json() : { zones: [] };
      const pkgData = pkgRes.ok ? await pkgRes.json() : { packages: [] };
      setAds(adsData.ads || []);
      setZones(zonesData.zones || []);
      setPackages(pkgData.packages || []);
    } catch {
      showFeedback('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function startCreate() {
    setEditingId(null);
    setForm(BLANK_FORM);
    setImageFile(null);
    setImagePreview(null);
    setActiveTab('form');
  }

  function startEdit(ad) {
    setEditingId(ad.id);
    setForm({
      zone: ad.zone || 'header_banner',
      ad_type: ad.ad_type || 'text',
      title: ad.title || '',
      body_text: ad.body_text || '',
      image_url: ad.image_url || '',
      link_url: ad.link_url || '',
      alt_text: ad.alt_text || '',
      advertiser_name: ad.advertiser_name || '',
      advertiser_email: ad.advertiser_email || '',
      advertiser_phone: ad.advertiser_phone || '',
      package_type: ad.package_type || 'bronze',
      is_active: ad.is_active !== false,
      display_order: ad.display_order || 0,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
    });
    setImageFile(null);
    setImagePreview(ad.image_url || null);
    setActiveTab('form');
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete ad "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/ads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setAds(prev => prev.filter(a => a.id !== id));
      showFeedback('Ad deleted successfully.');
    } catch {
      showFeedback('Failed to delete ad.', 'error');
    }
  }

  async function handleToggleActive(ad) {
    try {
      const res = await fetch(`${API_BASE}/api/ads/${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ad, is_active: !ad.is_active }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAds(prev => prev.map(a => a.id === ad.id ? data.ad : a));
      showFeedback(`Ad ${data.ad.is_active ? 'activated' : 'deactivated'}.`);
    } catch {
      showFeedback('Failed to update ad status.', 'error');
    }
  }

  /** Apply a quick-duration to the form: set start_date = today, end_date = today + days */
  function applyDuration(days) {
    const start = today();
    const end = addDays(start, days - 1);
    setForm(f => ({ ...f, start_date: start, end_date: end }));
  }

  /** Find the suggested price for the currently selected package + duration (if dates are set) */
  function getSuggestedPrice(pkg, pricing) {
    if (!form.start_date || !form.end_date) return null;
    const start = new Date(form.start_date + 'T12:00:00');
    const end   = new Date(form.end_date   + 'T12:00:00');
    const days  = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (days <= 0) return null;
    const pkgPricing = packages.find(p => p.type === pkg);
    if (!pkgPricing || !pkgPricing.pricing) return null;
    // Find closest duration tier
    const tiers = [...pkgPricing.pricing].sort((a, b) => a.days - b.days);
    const match = tiers.find(t => days <= t.days) || tiers[tiers.length - 1];
    return { price: match.price, duration: match.duration, days };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        // Explicitly include booleans and numbers; only skip null/undefined
        if (v !== null && v !== undefined) fd.append(k, v);
      });
      if (imageFile) fd.append('image', imageFile);

      const url = editingId ? `${API_BASE}/api/ads/${editingId}` : `${API_BASE}/api/ads`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: fd });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.errors ? data.errors.join(' ') : (data.error || 'Save failed.');
        showFeedback(msg, 'error');
        return;
      }

      showFeedback(editingId ? 'Ad updated successfully!' : 'Ad created successfully!');
      await fetchAll();
      setActiveTab('list');
      setEditingId(null);
      setForm(BLANK_FORM);
      setImageFile(null);
      setImagePreview(null);
    } catch {
      showFeedback('An error occurred while saving the ad.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredAds = filterZone ? ads.filter(a => a.zone === filterZone) : ads;
  const zoneLabel = id => zones.find(z => z.id === id)?.label || id;

  const inputStyle = {
    width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px',
    border: '1px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box',
  };
  const labelStyle = {
    display: 'block', fontWeight: 600, color: '#374151',
    marginBottom: '0.3rem', fontSize: '0.83rem',
  };
  const sectionCard = {
    background: 'white', borderRadius: '12px', padding: '1.5rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)', marginBottom: '1.25rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Page header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0284c7 100%)', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '1.85rem', fontWeight: 700, margin: '0 0 0.4rem' }}>
            📢 Advertising Manager
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.98rem' }}>
            Manage ad zones, upload creatives, and configure advertising packages.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Feedback */}
        {feedback && (
          <div style={{
            padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem',
            background: feedback.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: feedback.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${feedback.type === 'error' ? '#fca5a5' : '#86efac'}`,
            fontWeight: 500,
          }}>
            {feedback.type === 'error' ? '❌ ' : '✅ '}{feedback.msg}
          </div>
        )}

        {/* Package overview cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {packages.map(pkg => (
            <div key={pkg.type} style={{
              background: 'white', borderRadius: '10px', padding: '1rem 1.25rem',
              borderTop: `4px solid ${PACKAGE_COLOURS[pkg.type] || '#6b7280'}`,
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: PACKAGE_COLOURS[pkg.type], textTransform: 'capitalize', marginBottom: '0.5rem' }}>
                {PACKAGE_ICONS[pkg.type]} {pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.6 }}>
                <div>📝 Max words: <strong>{pkg.maxWords}</strong></div>
                <div>🖼️ Image: <strong>{pkg.maxImageWidth > 0 ? `${pkg.maxImageWidth}×${pkg.maxImageHeight}` : 'Text only'}</strong></div>
                <div>🎬 Video: <strong>{pkg.maxVideoSeconds > 0 ? `${pkg.maxVideoSeconds}s` : '—'}</strong></div>
                <div>📍 Zones: <strong>{pkg.maxZones >= 99 ? 'All' : pkg.maxZones}</strong></div>
                {pkg.pricing && (
                  <div style={{ marginTop: '0.4rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.4rem', color: '#374151' }}>
                    💰 From <strong>£{pkg.pricing[0].price}/wk</strong>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
          {[
            { id: 'list',    label: '📋 All Ads' },
            { id: 'zones',   label: '📍 Ad Zones' },
            { id: 'pricing', label: '💰 Pricing Guide' },
            { id: 'form',    label: editingId ? '✏️ Edit Ad' : '➕ New Ad' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { if (tab.id !== 'form') { setEditingId(null); setForm(BLANK_FORM); setImagePreview(null); } setActiveTab(tab.id); }}
              style={{
                padding: '0.5rem 1.1rem', borderRadius: '7px 7px 0 0', border: 'none',
                background: activeTab === tab.id ? 'var(--aegean-blue, #1e3a5f)' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#374151',
                fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: All Ads ── */}
        {activeTab === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={filterZone} onChange={e => setFilterZone(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                  <option value="">All Zones</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                </select>
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{filteredAds.length} ad{filteredAds.length !== 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={startCreate}
                style={{ padding: '0.5rem 1.2rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '7px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
              >
                ➕ New Ad
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading…</div>
            ) : filteredAds.length === 0 ? (
              <div style={{ ...sectionCard, textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📢</div>
                <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No ads yet</h3>
                <p style={{ margin: '0 0 1.5rem' }}>Create your first advertisement using the "New Ad" button above.</p>
                <button onClick={startCreate} style={{ padding: '0.6rem 1.4rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '7px', fontWeight: 600, cursor: 'pointer' }}>
                  ➕ Create First Ad
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredAds.map(ad => (
                  <div key={ad.id} style={{
                    ...sectionCard, padding: '1rem 1.25rem', marginBottom: 0,
                    display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                    borderLeft: `4px solid ${ad.is_active ? '#22c55e' : '#d1d5db'}`,
                  }}>
                    {/* Thumbnail */}
                    {ad.image_url ? (
                      <img src={ad.image_url} alt={ad.alt_text || ad.title} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <div style={{ width: 60, height: 40, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                        {AD_TYPE_LABELS[ad.ad_type]?.split(' ')[0] || '📄'}
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ad.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.15rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                          {zoneLabel(ad.zone)}
                        </span>
                        <span>{AD_TYPE_LABELS[ad.ad_type]}</span>
                        <span style={{ color: PACKAGE_COLOURS[ad.package_type], fontWeight: 600, textTransform: 'capitalize' }}>
                          {PACKAGE_ICONS[ad.package_type]} {ad.package_type}
                        </span>
                        {ad.advertiser_name && <span style={{ color: '#374151', fontWeight: 600 }}>· {ad.advertiser_name}</span>}
                        {(ad.start_date || ad.end_date) && (
                          <span style={{ color: '#9ca3af', whiteSpace: 'nowrap' }}>
                            📅 {fmtDate(ad.start_date)} → {fmtDate(ad.end_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status + actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      <button
                        onClick={() => handleToggleActive(ad)}
                        style={{
                          padding: '0.3rem 0.75rem', borderRadius: 5, border: 'none', cursor: 'pointer',
                          fontWeight: 600, fontSize: '0.78rem',
                          background: ad.is_active ? '#dcfce7' : '#f3f4f6',
                          color: ad.is_active ? '#166534' : '#6b7280',
                        }}
                        title={ad.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {ad.is_active ? '✅ Active' : '⏸ Paused'}
                      </button>
                      <button
                        onClick={() => startEdit(ad)}
                        style={{ padding: '0.3rem 0.75rem', borderRadius: 5, border: '1.5px solid #6b7280', background: 'transparent', color: '#374151', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id, ad.title)}
                        style={{ padding: '0.3rem 0.75rem', borderRadius: 5, border: '1.5px solid #fca5a5', background: 'transparent', color: '#dc2626', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Ad Zones ── */}
        {activeTab === 'zones' && (
          <div>
            <p style={{ color: '#6b7280', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              The table below lists all available advertising zones across the site. Each zone has a recommended size. Sell different zones to different advertisers.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {zones.map(zone => {
                const count = ads.filter(a => a.zone === zone.id && a.is_active).length;
                return (
                  <div key={zone.id} style={{ ...sectionCard, marginBottom: 0, borderTop: '3px solid #0284c7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.95rem' }}>{zone.label}</div>
                      <span style={{ background: count > 0 ? '#dcfce7' : '#f3f4f6', color: count > 0 ? '#166534' : '#6b7280', padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600 }}>
                        {count} active
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.4rem 0 0.75rem' }}>{zone.description}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                        📐 {zone.width}×{zone.height}px
                      </span>
                      <span style={{ background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                        🆔 {zone.id}
                      </span>
                    </div>
                    <button
                      onClick={() => { setForm(f => ({ ...f, zone: zone.id })); startCreate(); }}
                      style={{ marginTop: '0.85rem', padding: '0.35rem 0.8rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      ➕ Add Ad Here
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab: Pricing Guide ── */}
        {activeTab === 'pricing' && (
          <div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#92400e' }}>
              💡 <strong>Startup Pricing (GBP incl. VAT).</strong> These are suggested launch rates for a UK-focused Turkish travel platform. Prices are indicative — adjust as traffic and demand grow. All packages allow one advertiser per zone booking.
            </div>

            {/* Pricing table */}
            <div style={{ overflowX: 'auto', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#1e3a5f', color: 'white' }}>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700 }}>Package</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, opacity: 0.85 }}>What's Included</th>
                    {QUICK_DURATIONS.map(d => (
                      <th key={d.label} style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>{d.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {packages.filter(p => p.pricing).map((pkg, idx) => (
                    <tr key={pkg.type} style={{ background: idx % 2 === 0 ? 'white' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: PACKAGE_COLOURS[pkg.type] }}>
                        {PACKAGE_ICONS[pkg.type]} {pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#6b7280', fontSize: '0.8rem', maxWidth: 220 }}>
                        {pkg.description}
                      </td>
                      {QUICK_DURATIONS.map(dur => {
                        const tier = pkg.pricing.find(t => t.days === dur.days);
                        return (
                          <td key={dur.label} style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#111827' }}>
                            {tier ? `£${tier.price.toLocaleString()}` : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Per-package breakdown cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {packages.filter(p => p.pricing).map(pkg => (
                <div key={pkg.type} style={{
                  background: 'white', borderRadius: 10, padding: '1.25rem',
                  borderTop: `4px solid ${PACKAGE_COLOURS[pkg.type]}`,
                  boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: PACKAGE_COLOURS[pkg.type], marginBottom: '0.3rem' }}>
                    {PACKAGE_ICONS[pkg.type]} {pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)} Package
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.85rem' }}>{pkg.description}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {pkg.pricing.map(t => (
                      <div key={t.duration} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ color: '#374151' }}>{t.duration}</span>
                        <span style={{ fontWeight: 700, color: '#111827' }}>£{t.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setForm(f => ({ ...f, package_type: pkg.type })); startCreate(); }}
                    style={{ marginTop: '1rem', width: '100%', padding: '0.45rem', background: PACKAGE_COLOURS[pkg.type], color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    ➕ Book {pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)} Ad
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: New / Edit Form ── */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

              {/* Left column */}
              <div>
                <div style={sectionCard}>
                  <h2 style={{ color: '#1e3a5f', marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>
                    📋 Ad Details
                  </h2>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Ad Title (internal label) *</label>
                    <input name="title" value={form.title} onChange={handleFormChange} placeholder="e.g. Sunrise Hotel June Campaign" style={inputStyle} required />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Advertiser Company / Name *</label>
                    <input name="advertiser_name" value={form.advertiser_name} onChange={handleFormChange} placeholder="Company or individual name" style={inputStyle} required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Advertiser Email</label>
                      <input name="advertiser_email" value={form.advertiser_email} onChange={handleFormChange} placeholder="billing@company.com" type="email" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Advertiser Phone</label>
                      <input name="advertiser_phone" value={form.advertiser_phone} onChange={handleFormChange} placeholder="+44 7700 900000" style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Ad Zone *</label>
                      <select name="zone" value={form.zone} onChange={handleFormChange} style={inputStyle} required>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Ad Type *</label>
                      <select name="ad_type" value={form.ad_type} onChange={handleFormChange} style={inputStyle} required>
                        <option value="text">📝 Text</option>
                        <option value="image">🖼️ Image</option>
                        <option value="html">🌐 HTML</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Package Type</label>
                    <select name="package_type" value={form.package_type} onChange={handleFormChange} style={inputStyle}>
                      {['bronze', 'silver', 'gold', 'platinum'].map(p => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Destination URL (click-through link)</label>
                    <input name="link_url" value={form.link_url} onChange={handleFormChange} placeholder="https://www.example.com" type="url" style={inputStyle} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Display Order</label>
                      <input name="display_order" value={form.display_order} onChange={handleFormChange} type="number" min="0" style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                        <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleFormChange} style={{ width: 16, height: 16 }} />
                        <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Active</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Campaign Booking */}
                <div style={{ ...sectionCard, borderLeft: '4px solid #0284c7' }}>
                  <h2 style={{ color: '#1e3a5f', marginTop: 0, marginBottom: '0.25rem', fontSize: '1rem' }}>
                    📅 Campaign Booking & Dates
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '0.78rem', margin: '0 0 1rem' }}>
                    Each booking is per company. Select a duration below to auto-fill the dates, or enter manually.
                  </p>

                  {/* Quick Duration buttons */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Quick Duration</label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {QUICK_DURATIONS.map(d => (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => applyDuration(d.days)}
                          style={{
                            padding: '0.3rem 0.75rem', borderRadius: 6, border: '1.5px solid #d1d5db',
                            background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Start Date</label>
                      <input name="start_date" value={form.start_date} onChange={handleFormChange} type="date" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>End Date</label>
                      <input name="end_date" value={form.end_date} onChange={handleFormChange} type="date" style={inputStyle} />
                    </div>
                  </div>

                  {/* Price estimate */}
                  {(() => {
                    const est = getSuggestedPrice(form.package_type, packages);
                    if (!est) return (
                      <div style={{ fontSize: '0.78rem', color: '#9ca3af', background: '#f9fafb', borderRadius: 6, padding: '0.6rem 0.75rem' }}>
                        Select a duration above to see a suggested price.
                      </div>
                    );
                    return (
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600, marginBottom: '0.1rem' }}>
                            💰 Suggested Price ({est.days} day{est.days !== 1 ? 's' : ''})
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                            Based on {form.package_type} × {est.duration} tier
                          </div>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#166534' }}>
                          £{est.price.toLocaleString()}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right column */}
              <div>
                <div style={sectionCard}>
                  <h2 style={{ color: '#1e3a5f', marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>
                    🎨 Creative Content
                  </h2>

                  {/* Text / HTML body */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>
                      {form.ad_type === 'html' ? 'HTML Content' : 'Ad Body Text'}
                    </label>
                    <textarea
                      name="body_text"
                      value={form.body_text}
                      onChange={handleFormChange}
                      rows={5}
                      placeholder={form.ad_type === 'html' ? '<div>Your HTML here…</div>' : 'Short advertising copy…'}
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: form.ad_type === 'html' ? 'monospace' : 'inherit' }}
                    />
                    {form.body_text && (
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.2rem' }}>
                        {form.body_text.trim().split(/\s+/).filter(Boolean).length} words
                      </div>
                    )}
                  </div>

                  {/* Image upload */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Upload Image</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                      onChange={handleImageChange}
                      style={{ ...inputStyle, padding: '0.4rem' }}
                    />
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                      JPG, PNG, GIF, WebP, SVG · Max 5 MB
                    </div>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" style={{ marginTop: '0.75rem', maxWidth: '100%', maxHeight: 160, borderRadius: 6, border: '1px solid #e5e7eb' }} />
                    )}
                  </div>

                  {/* Existing image URL */}
                  {!imageFile && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={labelStyle}>Or enter external Image URL</label>
                      <input name="image_url" value={form.image_url} onChange={handleFormChange} placeholder="https://cdn.example.com/banner.jpg" style={inputStyle} />
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Image Alt Text</label>
                    <input name="alt_text" value={form.alt_text} onChange={handleFormChange} placeholder="Describe the image for accessibility" style={inputStyle} />
                  </div>
                </div>

                {/* Preview */}
                {(form.body_text || imagePreview || form.image_url) && (
                  <div style={sectionCard}>
                    <h2 style={{ color: '#1e3a5f', marginTop: 0, marginBottom: '0.75rem', fontSize: '1rem' }}>👁️ Preview</h2>
                    <div style={{ border: '1px dashed #d1d5db', borderRadius: 8, padding: '0.5rem', background: '#f9fafb' }}>
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Advertisement</div>
                      {form.ad_type === 'image' && (imagePreview || form.image_url) ? (
                        <div>
                          <img src={imagePreview || (form.image_url && /^https?:\/\//i.test(form.image_url) ? form.image_url : '')} alt={form.alt_text || 'Preview'} style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 6, objectFit: 'cover' }} />
                          {form.body_text && <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#374151' }}>{form.body_text}</div>}
                        </div>
                      ) : (
                        <div style={{ background: 'linear-gradient(90deg,#f0f9ff,#e0f2fe)', padding: '0.75rem', borderRadius: 6 }}>
                          {form.title && <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.9rem' }}>{form.title}</div>}
                          {form.body_text && <div style={{ fontSize: '0.82rem', color: '#374151', marginTop: '0.2rem' }}>{form.body_text}</div>}
                          {form.advertiser_name && <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.3rem' }}>{form.advertiser_name}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: '0.65rem 1.8rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? '⏳ Saving…' : editingId ? '💾 Update Ad' : '🚀 Create Ad'}
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('list'); setEditingId(null); setForm(BLANK_FORM); setImageFile(null); setImagePreview(null); }}
                style={{ padding: '0.65rem 1.2rem', background: 'transparent', color: '#6b7280', border: '1.5px solid #d1d5db', borderRadius: 8, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdManager;
