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
