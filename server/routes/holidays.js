const express = require('express');
const router = express.Router();
const {
  EXCURSION_CATALOG,
  TRANSFER_TYPES,
  AIRPORT_ROUTES,
  PACKAGE_CATALOG,
} = require('../data/travelCatalogs');

// Destination → airport code mapping used to find relevant transfers
const DEST_TO_AIRPORT = {
  antalya: 'AYT',
  bodrum: 'BJV',
  marmaris: 'DLM',
  fethiye: 'DLM',
  kusadasi: 'ADB',
  izmir: 'ADB',
  istanbul: 'IST',
  cappadocia: 'ESB',
};

// Destination → HotelBeds destination code
const DEST_CODE_MAP = {
  bodrum: 'BOD',
  antalya: 'ANT',
  istanbul: 'IST',
  marmaris: 'MAR',
  fethiye: 'FET',
  kusadasi: 'KUS',
  izmir: 'IZM',
  cappadocia: 'CAP',
};

/**
 * Calculate the whole-day difference between two ISO date strings.
 * Uses UTC midnight values so that DST transitions do not skew the count.
 * Returns null if either date is missing or unparseable.
 */
function daysBetweenDates(isoFrom, isoTo) {
  if (!isoFrom || !isoTo) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  const from = Date.UTC(
    ...isoFrom.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n)))
  );
  const to = Date.UTC(
    ...isoTo.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n)))
  );
  if (isNaN(from) || isNaN(to)) return null;
  return Math.round((to - from) / msPerDay);
}

/**
 * Build affiliate booking deep-links for a given destination and date range.
 * These are referral / affiliate URLs that earn commission when a user books.
 * All providers are ATOL-protected; TürkiyeAI acts only as a discovery referrer.
 */
function buildAffiliateLinks({ destination, checkIn, checkOut, adults, children }) {
  const dest = (destination || '').toLowerCase().trim();
  const pax = parseInt(adults || 2, 10) + parseInt(children || 0, 10);

  // Jet2holidays – Awin affiliate deep-link skeleton
  const jet2Base = 'https://www.jet2holidays.com/holidays/turkey';
  const durationDays = daysBetweenDates(checkIn, checkOut) || 7;
  const jet2Link = `${jet2Base}?depDate=${checkIn}&dur=${durationDays}&adults=${adults || 2}&children=${children || 0}&src=turkiyeai`;

  // TUI – Awin affiliate deep-link skeleton
  const tuiBase = 'https://www.tui.co.uk/destinations/europe/turkey';
  const tuiLink = `${tuiBase}?depDate=${checkIn}&pax=${pax}&src=turkiyeai`;

  // On the Beach – Awin affiliate deep-link skeleton
  const otbBase = `https://www.onthebeach.co.uk/holidays/europe/turkey/${dest}`;
  const otbLink = `${otbBase}?depDate=${checkIn}&adults=${adults || 2}&children=${children || 0}&src=turkiyeai`;

  // Love Holidays – Awin affiliate deep-link skeleton
  const lhBase = 'https://www.loveholidays.com/holidays/turkey';
  const lhLink = `${lhBase}?depDate=${checkIn}&adults=${adults || 2}&children=${children || 0}&src=turkiyeai`;

  return [
    {
      provider: 'Jet2holidays',
      icon: '✈️',
      logo_alt: 'Jet2holidays',
      description: 'ATOL-protected all-inclusive packages to Turkey',
      commission: '2–3%',
      url: jet2Link,
      atol_protected: true,
      cta: 'Book with Jet2holidays',
    },
    {
      provider: 'TUI',
      icon: '🌞',
      logo_alt: 'TUI',
      description: 'Award-winning all-inclusive Turkish holidays',
      commission: '2–3%',
      url: tuiLink,
      atol_protected: true,
      cta: 'Book with TUI',
    },
    {
      provider: 'On the Beach',
      icon: '🏖️',
      logo_alt: 'On the Beach',
      description: 'Flexible beach holidays to Turkey',
      commission: '2–3%',
      url: otbLink,
      atol_protected: true,
      cta: 'Book with On the Beach',
    },
    {
      provider: 'Love Holidays',
      icon: '❤️',
      logo_alt: 'Love Holidays',
      description: 'Competitive holiday deals for Turkey',
      commission: '2–3%',
      url: lhLink,
      atol_protected: true,
      cta: 'Book with Love Holidays',
    },
  ];
}

/**
 * GET /api/holidays/plan
 * Returns a combined holiday plan for a destination and date range.
 * Includes matching packages, available transfers, and relevant excursions.
 *
 * Query params:
 *   destination  {string}  Destination name (e.g. "Bodrum")
 *   checkIn      {string}  ISO date string (e.g. "2026-08-01")
 *   checkOut     {string}  ISO date string (e.g. "2026-08-08")
 *   adults       {number}  Number of adults (default 2)
 *   children     {number}  Number of children (default 0)
 */
router.get('/plan', (req, res) => {
  const { destination, checkIn, checkOut, adults = 2, children = 0 } = req.query;

  if (!destination) {
    return res.status(400).json({ error: 'destination is required' });
  }

  const destKey = destination.toLowerCase().trim();
  const destCode = DEST_CODE_MAP[destKey] || null;

  // Validate optional dates
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (checkIn && !datePattern.test(checkIn)) {
    return res.status(400).json({ error: 'checkIn must be in YYYY-MM-DD format' });
  }
  if (checkOut && !datePattern.test(checkOut)) {
    return res.status(400).json({ error: 'checkOut must be in YYYY-MM-DD format' });
  }

  const adultsNum = Math.max(1, Math.min(parseInt(adults, 10) || 2, 20));
  const childrenNum = Math.max(0, Math.min(parseInt(children, 10) || 0, 10));

  const durationNights = daysBetweenDates(checkIn, checkOut);

  // Matching holiday packages
  const packages = PACKAGE_CATALOG.filter(
    p => p.destination.toLowerCase() === destKey
  );

  // Airport transfers for the destination
  const airportCode = DEST_TO_AIRPORT[destKey] || null;
  const transferRoutes = airportCode
    ? AIRPORT_ROUTES.filter(r => r.from === airportCode).map(route => ({
        ...route,
        vehicles: TRANSFER_TYPES.map(v => ({
          ...v,
          price_eur: Math.round(route.base_price_eur * v.price_multiplier * 100) / 100,
        })),
      }))
    : [];

  // Relevant excursions for the destination
  const excursions = EXCURSION_CATALOG.filter(
    e => e.destination.toLowerCase() === destKey
  );

  // Affiliate booking links
  const affiliateLinks = buildAffiliateLinks({ destination, checkIn, checkOut, adults: adultsNum, children: childrenNum });

  res.json({
    destination,
    destCode,
    checkIn: checkIn || null,
    checkOut: checkOut || null,
    durationNights,
    adults: adultsNum,
    children: childrenNum,
    packages,
    transfers: transferRoutes,
    excursions,
    affiliate_booking_links: affiliateLinks,
    hotels_endpoint: destCode ? `/api/hotels/search?destination=${encodeURIComponent(destination)}` : null,
    ai_note: 'Ask our AI Travel Agent for personalised recommendations for this holiday.',
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer:
      'TürkiyeAI is an AI discovery platform. All bookings are completed via licensed, ATOL-protected travel providers. Prices shown are indicative.',
  });
});

/**
 * GET /api/holidays/booking-links
 * Returns direct affiliate booking links for a destination and date range.
 * Lighter endpoint used by the booking summary widget.
 */
router.get('/booking-links', (req, res) => {
  const { destination, checkIn, checkOut, adults = 2, children = 0 } = req.query;

  if (!destination) {
    return res.status(400).json({ error: 'destination is required' });
  }

  const adultsNum = Math.max(1, Math.min(parseInt(adults, 10) || 2, 20));
  const childrenNum = Math.max(0, Math.min(parseInt(children, 10) || 0, 10));

  const links = buildAffiliateLinks({ destination, checkIn, checkOut, adults: adultsNum, children: childrenNum });

  res.json({
    destination,
    checkIn: checkIn || null,
    checkOut: checkOut || null,
    adults: adultsNum,
    children: childrenNum,
    booking_links: links,
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'All booking links lead to ATOL-protected providers. TürkiyeAI earns referral commission on qualifying bookings.',
  });
});

module.exports = router;
