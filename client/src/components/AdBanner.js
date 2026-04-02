import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '';

/**
 * AdBanner
 * Fetches and renders active ads for a given zone from /api/ads/zone/:zone.
 *
 * Props:
 *   zone        {string}  – ad zone identifier (e.g. "header_banner", "search_sidebar")
 *   style       {object}  – optional extra container styles
 *   className   {string}  – optional extra class name
 *   label       {boolean} – show "Advertisement" label (default: true)
 */
function AdBanner({ zone, style = {}, className = '', label = true }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!zone) return;
    setLoading(true);
    fetch(`${API_BASE}/api/ads/zone/${zone}`)
      .then(r => r.ok ? r.json() : { ads: [] })
      .then(data => setAds(data.ads || []))
      .catch(() => setAds([]))
      .finally(() => setLoading(false));
  }, [zone]);

  if (loading || ads.length === 0) return null;

  return (
    <div
      className={className}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        margin: '0.75rem 0',
        ...style,
      }}
    >
      {label && (
        <span style={{
          fontSize: '0.65rem',
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          alignSelf: 'flex-start',
          paddingLeft: '2px',
        }}>
          Advertisement
        </span>
      )}

      {ads.map(ad => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}

function isSafeUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}

function isSafeImageUrl(url) {
  if (!url) return false;
  // Allow relative paths (local uploads) and http/https external URLs
  if (url.startsWith('/') || url.startsWith('./')) return true;
  return isSafeUrl(url);
}

function AdCard({ ad }) {
  const containerStyle = {
    width: '100%',
    maxWidth: ad.ad_type === 'image' && ad.image_url ? '100%' : '728px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#fafafa',
    cursor: isSafeUrl(ad.link_url) ? 'pointer' : 'default',
  };

  function handleClick() {
    if (isSafeUrl(ad.link_url)) {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    }
  }

  if (ad.ad_type === 'image' && ad.image_url && isSafeImageUrl(ad.image_url)) {
    return (
      <div style={containerStyle} onClick={handleClick} title={ad.alt_text || ad.title}>
        <img
          src={ad.image_url}
          alt={ad.alt_text || ad.title}
          style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '250px', objectFit: 'cover' }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
        {ad.body_text && (
          <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: '#374151' }}>
            {ad.body_text}
          </div>
        )}
      </div>
    );
  }

  if (ad.ad_type === 'html') {
    return (
      <div
        style={containerStyle}
        onClick={handleClick}
        /* Safe: admin-controlled HTML only */
        dangerouslySetInnerHTML={{ __html: ad.body_text || '' }}
      />
    );
  }

  // Default: text ad
  return (
    <div
      style={{
        ...containerStyle,
        padding: '0.85rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: 'linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderColor: '#bae6fd',
      }}
      onClick={handleClick}
    >
      <div style={{ flex: 1 }}>
        {ad.title && (
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0369a1', marginBottom: '0.2rem' }}>
            {ad.title}
          </div>
        )}
        {ad.body_text && (
          <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>
            {ad.body_text}
          </div>
        )}
        {ad.advertiser_name && (
          <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.3rem' }}>
            {ad.advertiser_name}
          </div>
        )}
      </div>
      {isSafeUrl(ad.link_url) && (
        <span style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#0284c7',
          whiteSpace: 'nowrap',
          padding: '0.3rem 0.7rem',
          border: '1.5px solid #0284c7',
          borderRadius: '5px',
        }}>
          Learn More →
        </span>
      )}
    </div>
  );
}

export default AdBanner;
