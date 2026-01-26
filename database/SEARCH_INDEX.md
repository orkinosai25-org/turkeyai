# Azure AI Search Index Schema - TürkiyeAI Resorts

This document describes the Azure AI Search index schema for the TürkiyeAI resort search functionality, as specified in [Issue #5](https://github.com/orkinosai25-org/turkeyai/issues/5).

## Index Name

**turkiyeai-resorts**

## Overview

The index supports AI-powered semantic search over Turkish resorts and hotels, enabling the AI Travel Agent to provide intelligent, context-aware recommendations based on user preferences.

## Schema Fields

### Required Fields (from Issue #5)

| Field Name | Type | Searchable | Filterable | Sortable | Facetable | Description |
|------------|------|------------|------------|----------|-----------|-------------|
| `id` | Edm.String | ❌ | ❌ | ❌ | ❌ | Unique identifier (key field) |
| `region` | Edm.String | ✅ | ✅ | ✅ | ✅ | Geographic region (Bodrum, Marmaris, etc.) |
| `resort_name` | Edm.String | ✅ | ❌ | ✅ | ❌ | Name of the resort/hotel |
| `description` | Edm.String | ✅ | ❌ | ❌ | ❌ | Full description of the resort |
| `amenities` | Collection(Edm.String) | ✅ | ✅ | ❌ | ✅ | List of amenities (pool, spa, etc.) |
| `vibe_tags` | Collection(Edm.String) | ✅ | ✅ | ❌ | ✅ | Atmosphere/vibe tags (luxury, family, romantic) |
| `distance_to_airport` | Edm.Double | ❌ | ✅ | ✅ | ❌ | Distance to nearest airport in km |
| `family_friendly` | Edm.Boolean | ❌ | ✅ | ❌ | ✅ | Suitable for families with children |
| `adults_only` | Edm.Boolean | ❌ | ✅ | ❌ | ✅ | Adults-only property |
| `beach_type` | Edm.String | ✅ | ✅ | ❌ | ✅ | Type of beach (sandy, pebble, rocky) |
| `season_notes` | Edm.String | ✅ | ❌ | ❌ | ❌ | Best times to visit, seasonal info |

### Additional Fields

| Field Name | Type | Searchable | Filterable | Sortable | Facetable | Description |
|------------|------|------------|------------|----------|-----------|-------------|
| `star_rating` | Edm.Int32 | ❌ | ✅ | ✅ | ✅ | Hotel star rating (1-5) |
| `price_range` | Edm.String | ❌ | ✅ | ❌ | ✅ | Indicative price range |
| `latitude` | Edm.Double | ❌ | ❌ | ❌ | ❌ | GPS latitude coordinate |
| `longitude` | Edm.Double | ❌ | ❌ | ❌ | ❌ | GPS longitude coordinate |
| `location` | Edm.GeographyPoint | ❌ | ✅ | ✅ | ❌ | Geographic point for proximity search |

## AI Features

### Semantic Search Configuration

The index includes semantic search capabilities with the following configuration:

- **Configuration Name**: `resort-semantic-config`
- **Title Field**: `resort_name`
- **Content Fields**: `description`, `season_notes`
- **Keywords Fields**: `amenities`, `vibe_tags`

This enables natural language queries like:
- "Find a luxury beachfront hotel perfect for families in summer"
- "Adults-only resort with spa near Bodrum airport"
- "Budget-friendly hotels in the Turkish Riviera with pool"

### Auto-Suggest (Suggester)

- **Suggester Name**: `sg-resorts`
- **Mode**: analyzingInfixMatching
- **Source Fields**: `resort_name`, `region`, `amenities`

Enables autocomplete functionality in search boxes.

### Scoring Profile

- **Profile Name**: `boostByRating`
- **Text Weights**:
  - `resort_name`: 2.0 (highest priority)
  - `description`: 1.5
  - `amenities`: 1.0
- **Magnitude Function**: Boosts results based on `star_rating` (1-5 range)

Higher-rated resorts receive ranking boosts while maintaining relevance.

## Example Queries

### Basic Text Search
```javascript
const results = await searchClient.search('luxury beach resort bodrum');
```

### Filtered Search
```javascript
const results = await searchClient.search('resort', {
  filter: "family_friendly eq true and star_rating ge 4",
  orderby: "star_rating desc"
});
```

### Faceted Search
```javascript
const results = await searchClient.search('beach', {
  facets: ["region", "amenities", "star_rating"]
});
```

### Proximity Search
```javascript
const results = await searchClient.search('resort', {
  filter: "geo.distance(location, geography'POINT(27.4305 37.0344)') le 20"
  // Find resorts within 20km of Bodrum
});
```

### Semantic Search
```javascript
const results = await searchClient.search(
  'romantic getaway with private beach and sunset views',
  {
    queryType: 'semantic',
    semanticConfiguration: 'resort-semantic-config'
  }
);
```

## Usage with AI Agent

The AI Travel Agent uses this index to:

1. **Answer questions** about resorts with factual, grounded information
2. **Filter and recommend** based on user preferences (budget, dates, travelers, vibe)
3. **Compare options** across different regions and amenities
4. **Build itineraries** by selecting suitable accommodations

The agent NEVER invents prices or availability - it only uses data from this index and external APIs.

## Data Population

### From PostgreSQL

The `populateSearchIndex.js` script syncs data from the PostgreSQL `hotels` and `destinations` tables:

```bash
cd server/config
node populateSearchIndex.js populate
```

### Mapping

| PostgreSQL Field | Search Index Field |
|------------------|-------------------|
| `hotels.id` | `id` |
| `hotels.name` | `resort_name` |
| `destinations.region` | `region` |
| `hotels.description` | `description` |
| `hotel_amenities.amenity_name` | `amenities[]` |
| `hotels.star_rating` | `star_rating` |
| `destinations.best_time_to_visit` | `season_notes` |

Note: `family_friendly`, `adults_only`, and `vibe_tags` are generated algorithmically or need to be added to the database schema.

## Maintenance

### Update Index Schema

1. Edit `database/azure-search-index-schema.json`
2. Run: `node server/config/createSearchIndex.js create`
3. Re-populate data: `node server/config/populateSearchIndex.js populate`

### Clear All Documents

```bash
cd server/config
node populateSearchIndex.js clear
```

### Check Index Status

```bash
cd server/config
node createSearchIndex.js info
```

## File Locations

- **Schema Definition**: `database/azure-search-index-schema.json`
- **Index Creation Script**: `server/config/createSearchIndex.js`
- **Data Population Script**: `server/config/populateSearchIndex.js`
- **Search Client Config**: `server/config/azureSearch.js`

## Related Documentation

- [Azure Setup Guide](../docs/AZURE_SETUP.md)
- [Issue #5 - Azure AI Search Requirements](https://github.com/orkinosai25-org/turkeyai/issues/5)
- [Azure AI Search Documentation](https://learn.microsoft.com/azure/search/)

## License

Copyright © 2024 OrkinosAI Ltd. All rights reserved.
