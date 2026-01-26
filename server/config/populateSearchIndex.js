const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");
const pool = require('../config/database');
const path = require('path');

/**
 * Populate Azure AI Search index with data from PostgreSQL
 * Maps hotel/resort data from the database to the search index schema
 */
async function populateSearchIndex() {
  try {
    // Get Azure Search credentials from environment
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const apiKey = process.env.AZURE_SEARCH_API_KEY;
    const indexName = 'turkiyeai-resorts';
    
    if (!endpoint || !apiKey) {
      throw new Error('Azure AI Search credentials not configured. Please set AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_API_KEY.');
    }

    console.log('Connecting to Azure AI Search...');
    console.log('Index:', indexName);

    // Create SearchClient
    const searchClient = new SearchClient(
      endpoint,
      indexName,
      new AzureKeyCredential(apiKey)
    );

    console.log('Fetching resort data from PostgreSQL...');

    // Query to get all resorts with related data
    const query = `
      SELECT 
        h.id,
        h.name as resort_name,
        h.description,
        h.star_rating,
        h.price_range,
        h.latitude,
        h.longitude,
        d.region,
        d.destination_type as beach_type,
        d.best_time_to_visit as season_notes,
        COALESCE(
          json_agg(
            DISTINCT ha.amenity_name
          ) FILTER (WHERE ha.amenity_name IS NOT NULL),
          '[]'
        ) as amenities
      FROM hotels h
      LEFT JOIN destinations d ON h.destination_id = d.id
      LEFT JOIN hotel_amenities ha ON h.id = ha.hotel_id
      WHERE h.is_active = true
      GROUP BY h.id, h.name, h.description, h.star_rating, h.price_range, 
               h.latitude, h.longitude, d.region, d.destination_type, d.best_time_to_visit
    `;

    const result = await pool.query(query);
    const resorts = result.rows;

    if (resorts.length === 0) {
      console.log('No resort data found in database. Please ensure the database is populated.');
      return { uploadedCount: 0 };
    }

    console.log(`Found ${resorts.length} resorts to index`);

    // Transform data to match index schema
    const documents = resorts.map(resort => {
      // Parse amenities JSON if it's a string
      let amenities = [];
      if (resort.amenities) {
        amenities = typeof resort.amenities === 'string' 
          ? JSON.parse(resort.amenities) 
          : resort.amenities;
      }

      // Generate vibe tags based on data (simple heuristic)
      const vibe_tags = [];
      if (resort.star_rating >= 4) vibe_tags.push('luxury');
      if (resort.price_range && resort.price_range.includes('$$$')) vibe_tags.push('premium');
      if (resort.region && resort.region.includes('Beach')) vibe_tags.push('beach');
      
      // Build document matching index schema
      const doc = {
        id: resort.id,
        resort_name: resort.resort_name,
        region: resort.region || 'Unknown',
        description: resort.description || '',
        amenities: amenities.filter(a => a), // Remove nulls
        vibe_tags: vibe_tags,
        // TODO: Calculate distance_to_airport using actual airport coordinates
        // For now, defaulting to 0.0 until we have airport location data
        distance_to_airport: 0.0,
        // TODO: Add family_friendly and adults_only fields to database schema
        // These should be determined based on actual resort policies
        family_friendly: true,
        adults_only: false,
        beach_type: resort.beach_type || 'Mixed',
        season_notes: resort.season_notes || 'Year-round',
        star_rating: resort.star_rating || 3,
        price_range: resort.price_range || 'Moderate'
      };

      // Add geographic coordinates
      if (resort.latitude && resort.longitude) {
        doc.latitude = parseFloat(resort.latitude);
        doc.longitude = parseFloat(resort.longitude);
        doc.location = {
          type: 'Point',
          coordinates: [doc.longitude, doc.latitude]
        };
      }

      return doc;
    });

    console.log('Uploading documents to Azure AI Search...');
    
    // Upload documents in batches
    const batchSize = 100;
    let uploadedCount = 0;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const uploadResult = await searchClient.uploadDocuments(batch);
      
      const successCount = uploadResult.results.filter(r => r.succeeded).length;
      uploadedCount += successCount;
      
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: Uploaded ${successCount}/${batch.length} documents`);
      
      // Log any errors
      const errors = uploadResult.results.filter(r => !r.succeeded);
      if (errors.length > 0) {
        console.error('Errors in batch:');
        errors.forEach(err => {
          console.error(`  - Document ${err.key}: ${err.errorMessage}`);
        });
      }
    }

    console.log(`\n✓ Successfully uploaded ${uploadedCount}/${documents.length} documents to search index`);
    
    return { uploadedCount, totalCount: documents.length };

  } catch (error) {
    console.error('✗ Failed to populate search index:');
    console.error(error.message);
    throw error;
  }
}

/**
 * Clear all documents from the index
 */
async function clearSearchIndex() {
  try {
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const apiKey = process.env.AZURE_SEARCH_API_KEY;
    const indexName = 'turkiyeai-resorts';
    
    if (!endpoint || !apiKey) {
      throw new Error('Azure AI Search credentials not configured.');
    }

    const searchClient = new SearchClient(
      endpoint,
      indexName,
      new AzureKeyCredential(apiKey)
    );

    console.log('Fetching all document IDs...');
    
    // Get all document IDs
    const searchResults = await searchClient.search('*', {
      select: ['id'],
      top: 1000
    });

    const documentIds = [];
    for await (const result of searchResults.results) {
      documentIds.push({ id: result.document.id });
    }

    if (documentIds.length === 0) {
      console.log('Index is already empty.');
      return { deletedCount: 0 };
    }

    console.log(`Deleting ${documentIds.length} documents...`);
    
    const deleteResult = await searchClient.deleteDocuments(documentIds);
    const deletedCount = deleteResult.results.filter(r => r.succeeded).length;

    console.log(`✓ Deleted ${deletedCount}/${documentIds.length} documents`);
    
    return { deletedCount, totalCount: documentIds.length };

  } catch (error) {
    console.error('✗ Failed to clear search index:');
    console.error(error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  
  const command = process.argv[2] || 'populate';
  
  if (command === 'populate') {
    populateSearchIndex()
      .then(() => {
        console.log('\n✓ Done!');
        process.exit(0);
      })
      .catch(() => {
        console.error('\n✗ Failed!');
        process.exit(1);
      });
  } else if (command === 'clear') {
    clearSearchIndex()
      .then(() => {
        console.log('\n✓ Done!');
        process.exit(0);
      })
      .catch(() => {
        console.error('\n✗ Failed!');
        process.exit(1);
      });
  } else {
    console.log('Usage: node populateSearchIndex.js [populate|clear]');
    process.exit(1);
  }
}

module.exports = {
  populateSearchIndex,
  clearSearchIndex
};
