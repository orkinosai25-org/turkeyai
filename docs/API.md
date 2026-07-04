# API Documentation

This document describes the REST API endpoints for the TürkiyeAI platform.

## Base URL

- **Development:** `http://localhost:5000/api`
- **Production:** `https://turkiyeai.travel/api`

## Authentication

Currently, the API does not require authentication for basic features. Future versions will implement user authentication for personalized features.

---

## Endpoints

### Health Check

#### `GET /api/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "TürkiyeAI API",
  "brand": "Powered by OrkinosAI",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

---

## Settings

### Get Settings Status

#### `GET /api/settings/status`

Get the current Azure OpenAI configuration status without exposing sensitive API keys.

**Response:**
```json
{
  "status": "configured",
  "source": "website",
  "endpoint": "https://your-resource-name.***",
  "deploymentName": "gpt-4o",
  "apiVersion": "2024-08-01-preview",
  "settings": {
    "maxTokens": 800,
    "temperature": 0.7,
    "topP": 0.95,
    "frequencyPenalty": 0,
    "presencePenalty": 0
  },
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

**Fields:**
- `status`: Configuration status (configured/error)
- `source`: Where settings were loaded from (website/local-env)
- `endpoint`: Masked Azure OpenAI endpoint
- `deploymentName`: GPT model deployment name
- `apiVersion`: Azure OpenAI API version
- `settings`: Current chat completion parameters

### Refresh Settings Cache

#### `POST /api/settings/refresh`

Clear the settings cache and force a fresh fetch from the settings source (website or environment variables).

**Response:**
```json
{
  "status": "success",
  "message": "Settings cache cleared. Next request will fetch fresh settings.",
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

**Use Case:**
- Use this endpoint when Azure settings have been updated on the website
- Forces immediate refresh without waiting for cache expiration (5 minutes)

---

## Chat / AI Agent

### Send Message to AI Travel Agent

#### `POST /api/chat`

Chat with the AI travel agent powered by Azure OpenAI.

**Request Body:**
```json
{
  "message": "What's the best time to visit Bodrum?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hello! How can I help you?"
    }
  ]
}
```

**Parameters:**
- `message` (string, required): User's message to the AI agent
- `conversationHistory` (array, optional): Previous conversation messages for context

**Response:**
```json
{
  "response": "Bodrum is best visited between May and October when the weather is warm and sunny. The summer months (June-August) are the busiest with the best beach weather, while May and September-October offer pleasant temperatures with fewer crowds.",
  "conversationId": "chatcmpl-123456",
  "model": "gpt-4",
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

---

## Destinations

### Get All Destinations

#### `GET /api/destinations`

Retrieve a list of all Turkish travel destinations.

**Response:**
```json
{
  "destinations": [
    {
      "id": 1,
      "name": "Bodrum",
      "region": "Aegean Coast",
      "description": "A stunning coastal town known for its beaches, nightlife, and ancient history.",
      "highlights": ["Bodrum Castle", "Beach Clubs", "Ancient Theater", "Marina"],
      "bestTime": "May to October",
      "type": "Beach & Culture"
    }
  ],
  "count": 5,
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

### Get Single Destination

#### `GET /api/destinations/:id`

Retrieve details of a specific destination by ID.

**Parameters:**
- `id` (integer): Destination ID

**Response:**
```json
{
  "destination": {
    "id": 1,
    "name": "Bodrum",
    "region": "Aegean Coast",
    "description": "A stunning coastal town known for its beaches, nightlife, and ancient history.",
    "highlights": ["Bodrum Castle", "Beach Clubs", "Ancient Theater", "Marina"],
    "bestTime": "May to October",
    "type": "Beach & Culture"
  },
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

**Error Response (404):**
```json
{
  "error": "Destination not found"
}
```

---

## Regions

### Get All Regions

#### `GET /api/regions`

Retrieve a list of all distinct regions with destination counts.

**Response:**
```json
{
  "regions": [
    {
      "region": "Aegean Coast",
      "destination_count": "2"
    },
    {
      "region": "Central Anatolia",
      "destination_count": "1"
    },
    {
      "region": "Mediterranean Coast",
      "destination_count": "2"
    }
  ],
  "count": 3,
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

### Get Region with Destinations

#### `GET /api/regions/:name`

Retrieve all destinations in a specific region.

**Parameters:**
- `name` (string): Region name (e.g., "Aegean Coast")

**Response:**
```json
{
  "region": "Aegean Coast",
  "destinations": [
    {
      "id": "uuid",
      "name": "Bodrum",
      "slug": "bodrum",
      "region": "Aegean Coast",
      "description": "A stunning coastal town...",
      "destination_type": "Beach & Culture",
      "best_time_to_visit": "May to October",
      "latitude": 37.0344,
      "longitude": 27.4305,
      "image_url": "..."
    }
  ],
  "count": 2,
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

**Error Response (404):**
```json
{
  "error": "Region not found",
  "region": "Unknown Region"
}
```

### Search Regions

#### `GET /api/regions/search/:term`

Search for regions by name.

**Parameters:**
- `term` (string): Search term

**Response:**
```json
{
  "regions": [
    {
      "region": "Aegean Coast",
      "destination_count": "2"
    }
  ],
  "count": 1,
  "searchTerm": "aegean",
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

---

## Hotels (HotelBeds Integration)

The hotel endpoints integrate with the [HotelBeds API](https://developer.hotelbeds.com) to provide real hotel
content, live availability/pricing, and bookings.

### Required Credentials

Set these values in `server/appsettings.json` under the `HotelBeds` section, or via environment variables:

| Setting | appsettings.json key | Environment variable | Description |
|---|---|---|---|
| API Key | `HotelBeds.ApiKey` | `HOTELBEDS_API_KEY` | Obtained from developer.hotelbeds.com |
| API Secret | `HotelBeds.ApiSecret` | `HOTELBEDS_API_SECRET` | Paired secret for HMAC-SHA256 signing |
| Base URL | `HotelBeds.BaseUrl` | `HOTELBEDS_BASE_URL` | See below |
| Language | `HotelBeds.Language` | `HOTELBEDS_LANGUAGE` | Default: `ENG` |
| Currency | `HotelBeds.Currency` | `HOTELBEDS_CURRENCY` | Default: `GBP` |

**BaseUrl options:**
- **Test/sandbox** (free, no real charges): `https://api.test.hotelbeds.com`
- **Production** (real hotel data, real bookings): `https://api.hotelbeds.com`

When credentials are not configured, hotel search falls back to static demo data and booking is disabled.

---

### Get HotelBeds Status

#### `GET /api/hotels/status`

Returns the current HotelBeds API configuration status without exposing secrets.

**Response:**
```json
{
  "configured": true,
  "environment": "production",
  "baseUrl": "https://api.hotelbeds.com",
  "language": "ENG",
  "currency": "GBP",
  "message": "HotelBeds production API is configured. Hotel search and bookings use real live data.",
  "setup": {
    "appsettings": "server/appsettings.json → HotelBeds section",
    "requiredFields": ["HotelBeds.ApiKey", "HotelBeds.ApiSecret"],
    "testBaseUrl": "https://api.test.hotelbeds.com",
    "productionBaseUrl": "https://api.hotelbeds.com",
    "developerPortal": "https://developer.hotelbeds.com"
  },
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

**`environment` values:**
- `production` – real hotel data and bookings (`api.hotelbeds.com`)
- `test` – sandbox/simulated data, no real charges (`api.test.hotelbeds.com`)
- `unknown` – non-standard BaseUrl

---

### Search Hotels by Destination

#### `GET /api/hotels/search`

Search hotels for a destination.  Uses HotelBeds Content API when configured; falls back to static demo
data otherwise.  The `source` field in the response indicates whether results are real (`hotelbeds`) or
demo (`static`).

**Query Parameters:**
- `destination` (string): Destination name (e.g. `Bodrum`, `Antalya`, `Istanbul`)

**Response:**
```json
{
  "hotels": [
    {
      "code": "43841",
      "name": "Kempinski Hotel Barbaros Bay Bodrum",
      "categoryCode": "5",
      "destinationName": "Bodrum",
      "zoneName": "Yalıkavak",
      "address": "Gerenkuyu Mevkii, Bodrum"
    }
  ],
  "total": 8,
  "destination": "Bodrum",
  "source": "hotelbeds",
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

**`source` values:**
- `hotelbeds` – live data from HotelBeds (credentials required)
- `static` – demo/fallback data (no credentials needed)

---

### Hotel Availability & Live Pricing

#### `POST /api/hotels/availability`

Search for available hotels with live pricing for specific dates.
Requires HotelBeds credentials.  Returns hotel rooms with `rateKey` values needed for booking.

**Request Body:**
```json
{
  "destination": "BOD",
  "checkIn": "2026-08-01",
  "checkOut": "2026-08-08",
  "adults": 2,
  "children": 0,
  "rooms": 1
}
```

**Response:**
```json
{
  "hotels": [
    {
      "code": 43841,
      "name": "Kempinski Hotel Barbaros Bay Bodrum",
      "rooms": [
        {
          "code": "DBL.ST",
          "name": "STANDARD DOUBLE ROOM",
          "rates": [
            {
              "rateKey": "20260801|20260808|W|1|43841|DBL.ST|...",
              "rateClass": "NOR",
              "rateType": "BOOKABLE",
              "net": "1540.00",
              "currency": "GBP",
              "boardCode": "BB",
              "boardName": "BED AND BREAKFAST"
            }
          ]
        }
      ]
    }
  ],
  "total": 12,
  "checkIn": "2026-08-01",
  "checkOut": "2026-08-08",
  "destination": "BOD",
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

**Error (503) – credentials not configured:**
```json
{
  "error": "HotelBeds API is not configured",
  "message": "Set HotelBeds.ApiKey and HotelBeds.ApiSecret in server/appsettings.json."
}
```

---

### Create Hotel Booking

#### `POST /api/hotels/book`

Create a confirmed hotel booking via HotelBeds.  Use the `rateKey` from a prior availability search.

> ⚠️ **Environment note:** Bookings made against the test BaseUrl (`api.test.hotelbeds.com`) are simulated
> and do **not** reserve a real room.  Set `HotelBeds.BaseUrl` to `https://api.hotelbeds.com` and use
> production credentials for real reservations.

**Request Body:**
```json
{
  "holder": {
    "name": "Jane",
    "surname": "Smith"
  },
  "rooms": [
    {
      "rateKey": "20260801|20260808|W|1|43841|DBL.ST|...",
      "paxes": [
        { "roomId": 1, "type": "AD", "name": "Jane", "surname": "Smith" },
        { "roomId": 1, "type": "AD", "name": "John", "surname": "Smith" }
      ]
    }
  ],
  "clientReference": "MY-REF-001",
  "remark": "Late check-in requested"
}
```

**Fields:**
- `holder` (object, required): Lead guest name and surname
- `rooms` (array, required): One entry per room booked
  - `rateKey` (string, required): Taken from availability response; time-limited
  - `paxes` (array, required): Each guest in the room
    - `roomId` (integer): Room number, starting at 1
    - `type` (string): `"AD"` for adult, `"CH"` for child
    - `name`, `surname` (string, required)
- `clientReference` (string, optional): Your internal reference; auto-generated if omitted
- `remark` (string, optional): Free-text note to the hotel

**Response (201 Created):**
```json
{
  "bookingReference": "1-4545A",
  "clientReference": "MY-REF-001",
  "status": "CONFIRMED",
  "hotel": {
    "checkIn": "2026-08-01",
    "checkOut": "2026-08-08",
    "code": 43841,
    "name": "KEMPINSKI HOTEL BARBAROS BAY BODRUM"
  },
  "holder": { "name": "Jane", "surname": "Smith" },
  "checkIn": "2026-08-01",
  "checkOut": "2026-08-08",
  "totalNet": "1540.00",
  "currency": "GBP",
  "environment": "production",
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

When called against the test environment, an additional `warning` field is included:
```json
{
  "environment": "test",
  "warning": "This booking was made against the HotelBeds SANDBOX (test environment). No real room has been reserved. Switch HotelBeds.BaseUrl to https://api.hotelbeds.com for real bookings."
}
```

**Error (400) – validation failure:**
```json
{
  "error": "Invalid rateKey",
  "message": "rooms[0].rateKey is required. Obtain it from POST /api/hotels/availability."
}
```

**Error (503) – credentials not configured:**
```json
{
  "error": "HotelBeds API is not configured",
  "message": "Set HotelBeds.ApiKey and HotelBeds.ApiSecret in server/appsettings.json. For real bookings also set HotelBeds.BaseUrl to https://api.hotelbeds.com."
}
```

---

### Get Hotel Details

#### `GET /api/hotels/:code`

Retrieve detailed information for a specific hotel by its numeric HotelBeds code.

**Parameters:**
- `code` (string): Numeric hotel code (1–6 digits)

**Response:**
```json
{
  "hotel": {
    "code": 43841,
    "name": { "content": "Kempinski Hotel Barbaros Bay Bodrum" },
    "categoryCode": "5",
    "categoryName": { "content": "5 Stars" },
    "destinationName": "Bodrum",
    "zoneName": "Yalıkavak",
    "address": { "content": "Gerenkuyu Mevkii, Bodrum" },
    "description": { "content": "..." },
    "coordinates": { "latitude": 37.068, "longitude": 27.352 },
    "facilities": [...],
    "images": [...]
  },
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

---

## Services

### Get All Service Verticals

#### `GET /api/services`

Retrieve an overview of all available TürkiyeAI travel service verticals and their associated supplier/GDS information.

**Response:**
```json
{
  "brand": "TürkiyeAI – Powered by OrkinosAI",
  "suppliers_overview": "10 supplier/API integrations registered. See GET /api/services/suppliers for full details.",
  "service_verticals": [
    {
      "vertical": "hotels",
      "title": "Hotels & Resorts",
      "description": "Luxury and boutique hotels across Turkey's finest destinations.",
      "icon": "🏨",
      "endpoint": "/api/resorts",
      "supplier_note": "Hotel availability via TBO, PROVAB contracted supplier APIs."
    }
  ]
}
```

---

### Get Supplier / API Registry

#### `GET /api/services/suppliers`

Retrieve the full registry of all API and GDS supplier integrations, including integration status, data provided, GBP support, UK compliance notes, and developer portal URLs.

**Query Parameters:**
- `vertical` (string, optional): Filter by service vertical (e.g., `hotels`, `flights`, `cars`, `transfers`, `excursions`, `packages`, `yachts`)
- `lar_validated` (`true`, optional): When set to `true`, returns only suppliers confirmed live in the OrkinosAI [LAR reference system](https://github.com/orkinosai25-org/lar_system)

**Example Requests:**
```
GET /api/services/suppliers?vertical=hotels
GET /api/services/suppliers?lar_validated=true
```

**Notes:**
- `lar_validated=true` is the only supported filter value. Omitting the parameter, or passing any other value, returns all suppliers without filtering by validation status.

**Response (with `?lar_validated=true`):**
```json
{
  "suppliers": [
    {
      "vertical": "hotels",
      "supplier": "Hotelbeds API",
      "integration": "recommended – not yet integrated",
      "data_provided": ["180,000+ properties globally", "Turkish Riviera depth", "Live rates", "Transfers API", "Static content API"],
      "gbp_support": true,
      "uk_compliance": "UK-registered entity; GDPR-compliant; widely used by ATOL holders",
      "portal_url": "https://developer.hotelbeds.com",
      "lar_validated": true
    }
  ],
  "count": 6,
  "filters": { "vertical": null, "lar_validated": "true" },
  "documentation": "/docs/API_SOURCES_AND_RECOMMENDATIONS.md",
  "lar_reference": "https://github.com/orkinosai25-org/lar_system",
  "brand": "TürkiyeAI – Powered by OrkinosAI",
  "note": "Suppliers marked lar_validated:true are confirmed live in the OrkinosAI LAR reference implementation."
}
```

---

### Get Car Hire Options

#### `GET /api/services/cars`

Retrieve car hire categories available at Turkish airports via Carnect GDS.

**Query Parameters:**
- `airport` (string, optional): Filter by IATA airport code (e.g., `AYT`, `BJV`, `DLM`)
- `category` (string, optional): Filter by vehicle category (e.g., `Economy`, `SUV`, `Luxury`)
- `seats_min` (integer, optional): Minimum seat count

---

### Get Flight Information

#### `GET /api/services/flights`

Retrieve Turkish airport information and popular UK–Turkey route guidance. Live flight search is powered by the Amadeus GDS integration.

---

### Get Package Holidays

#### `GET /api/services/packages`

Retrieve holiday package catalog with indicative pricing.

**Query Parameters:**
- `destination` (string, optional): Filter by destination name
- `category` (string, optional): Filter by package category
- `board_basis` (string, optional): Filter by board basis (e.g., `All Inclusive`)
- `duration_min` (integer, optional): Minimum nights
- `duration_max` (integer, optional): Maximum nights

---

### Get Excursions

#### `GET /api/services/excursions`

Retrieve the excursion and experiences catalog.

**Query Parameters:**
- `destination` (string, optional): Filter by destination
- `type` (string, optional): Filter by type (e.g., `Cultural`, `Adventure`, `Wellness`)
- `difficulty` (string, optional): Filter by difficulty level

---

### Get Transfers

#### `GET /api/services/transfers`

Retrieve airport transfer options with vehicle types and indicative pricing.

**Query Parameters:**
- `airport` (string, optional): Filter by departure IATA code
- `destination` (string, optional): Filter by destination name

---

### Get Cruises

#### `GET /api/services/cruises`

Retrieve cruise itineraries departing from or calling at Turkish ports.

**Query Parameters:**
- `departure_port` (string, optional): Filter by departure port
- `ship_type` (string, optional): Filter by ship type (e.g., `Ocean Cruise`, `Traditional Gulet`)
- `duration_min` (integer, optional): Minimum nights
- `duration_max` (integer, optional): Maximum nights

---

### Get Private Aviation

#### `GET /api/services/private-aviation`

Retrieve private jet and charter flight options to Turkish airports.

**Query Parameters:**
- `aircraft_type` (string, optional): Filter by aircraft type
- `max_passengers_min` (integer, optional): Minimum passenger capacity

---

### Get Private Boats & Yachts

#### `GET /api/services/yachts`

Retrieve yacht charter options along the Turkish coast via GRN (Global Resort Network).

**Query Parameters:**
- `vessel_type` (string, optional): Filter by vessel type (e.g., `Gulet`, `Motor Yacht`, `Superyacht`)
- `home_port` (string, optional): Filter by home port
- `max_guests_min` (integer, optional): Minimum guest capacity

---

## Resorts

### Get All Resorts

#### `GET /api/resorts`

Retrieve a list of all resorts/hotels with optional filters.

**Query Parameters:**
- `destination_id` (uuid, optional): Filter by destination ID
- `star_rating` (integer, optional): Filter by star rating (1-5)
- `region` (string, optional): Filter by region name

**Example Request:**
```
GET /api/resorts?star_rating=5&region=Aegean Coast
```

**Response:**
```json
{
  "resorts": [
    {
      "id": "uuid",
      "name": "Luxury Beach Resort",
      "slug": "luxury-beach-resort",
      "description": "5-star resort with private beach...",
      "star_rating": 5,
      "address": "123 Beach Road, Bodrum",
      "latitude": 37.0344,
      "longitude": 27.4305,
      "phone": "+90 252 123 4567",
      "email": "info@resort.com",
      "website_url": "https://resort.com",
      "booking_url": "https://booking.com/resort",
      "price_range": "$$$",
      "room_count": 200,
      "check_in_time": "15:00:00",
      "check_out_time": "11:00:00",
      "destination_name": "Bodrum",
      "destination_region": "Aegean Coast"
    }
  ],
  "count": 1,
  "filters": {
    "star_rating": 5,
    "region": "Aegean Coast"
  },
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

### Get Resort by ID

#### `GET /api/resorts/:id`

Retrieve details of a specific resort by UUID.

**Parameters:**
- `id` (uuid): Resort ID

**Response:**
```json
{
  "resort": {
    "id": "uuid",
    "name": "Luxury Beach Resort",
    "slug": "luxury-beach-resort",
    "description": "5-star resort...",
    "star_rating": 5,
    "address": "123 Beach Road, Bodrum",
    "latitude": 37.0344,
    "longitude": 27.4305,
    "phone": "+90 252 123 4567",
    "email": "info@resort.com",
    "website_url": "https://resort.com",
    "booking_url": "https://booking.com/resort",
    "price_range": "$$$",
    "room_count": 200,
    "check_in_time": "15:00:00",
    "check_out_time": "11:00:00",
    "destination_name": "Bodrum",
    "destination_region": "Aegean Coast",
    "destination_slug": "bodrum"
  },
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

**Error Response (404):**
```json
{
  "error": "Resort not found",
  "id": "uuid"
}
```

### Get Resort Amenities

#### `GET /api/resorts/:id/amenities`

Retrieve all amenities for a specific resort.

**Parameters:**
- `id` (uuid): Resort ID

**Response:**
```json
{
  "resort_id": "uuid",
  "resort_name": "Luxury Beach Resort",
  "amenities": [
    {
      "id": "uuid",
      "amenity_name": "Infinity Pool",
      "amenity_category": "Pool",
      "icon": "🏊"
    },
    {
      "id": "uuid",
      "amenity_name": "Spa & Wellness Center",
      "amenity_category": "Spa",
      "icon": "💆"
    }
  ],
  "count": 2,
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

**Error Response (404):**
```json
{
  "error": "Resort not found",
  "id": "uuid"
}
```

### Get Resorts by Region

#### `GET /api/resorts/region/:region`

Retrieve all resorts in a specific region.

**Parameters:**
- `region` (string): Region name (e.g., "Aegean Coast")

**Response:**
```json
{
  "region": "Aegean Coast",
  "resorts": [
    {
      "id": "uuid",
      "name": "Luxury Beach Resort",
      "slug": "luxury-beach-resort",
      "description": "5-star resort...",
      "star_rating": 5,
      "price_range": "$$$",
      "latitude": 37.0344,
      "longitude": 27.4305,
      "destination_name": "Bodrum",
      "destination_region": "Aegean Coast"
    }
  ],
  "count": 1,
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

### Search Resorts

#### `GET /api/resorts/search/:term`

Search for resorts by name or description.

**Parameters:**
- `term` (string): Search term

**Response:**
```json
{
  "resorts": [
    {
      "id": "uuid",
      "name": "Luxury Beach Resort",
      "slug": "luxury-beach-resort",
      "description": "5-star resort...",
      "star_rating": 5,
      "price_range": "$$$",
      "latitude": 37.0344,
      "longitude": 27.4305,
      "destination_name": "Bodrum",
      "destination_region": "Aegean Coast"
    }
  ],
  "count": 1,
  "searchTerm": "beach",
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

---

## Search

### Semantic Search

#### `POST /api/search`

Perform semantic search over Turkish travel content using Azure AI Search.

**Request Body:**
```json
{
  "query": "beach resorts in Turkish Riviera",
  "top": 10
}
```

**Parameters:**
- `query` (string, required): Search query
- `top` (integer, optional): Number of results to return (default: 10, max: 100)

**Response:**
```json
{
  "results": [
    {
      "id": "1",
      "title": "Best Time to Visit Bodrum",
      "content": "Bodrum is best visited between May and October when the weather is warm and sunny.",
      "score": 0.95,
      "category": "destination"
    },
    {
      "id": "2",
      "title": "Cappadocia Hot Air Balloon Tours",
      "content": "Experience the magical sunrise over Cappadocia's unique landscape from a hot air balloon.",
      "score": 0.88,
      "category": "activity"
    }
  ],
  "query": "beach resorts in Turkish Riviera",
  "count": 2,
  "brand": "TürkiyeAI - Powered by OrkinosAI",
  "note": "Configure Azure AI Search for production semantic search"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": "Message is required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to process request",
  "details": "Azure OpenAI service unavailable"
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. Future versions will include:
- 100 requests per minute per IP for unauthenticated users
- 500 requests per minute for authenticated users

---

## CORS

The API supports CORS for development. In production, configure allowed origins in the environment variables.

---

## Webhooks

Webhooks are not currently supported but may be added in future versions for:
- Itinerary updates
- Booking status changes (when integrated with partners)
- New destination additions

---

## Additional Notes

- All timestamps are in ISO 8601 format (UTC)
- All text responses support Turkish and English languages
- The AI agent is designed for travel recommendations only and does not process payments or bookings
- For bookings, users are redirected to licensed third-party providers
