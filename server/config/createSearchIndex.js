const { SearchIndexClient, AzureKeyCredential } = require("@azure/search-documents");
const fs = require('fs');
const path = require('path');

/**
 * Create or update Azure AI Search index for TürkiyeAI resorts
 * This script creates the turkiyeai-resorts index with the schema defined in
 * database/azure-search-index-schema.json
 */
async function createSearchIndex() {
  try {
    // Get Azure Search credentials from environment
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const apiKey = process.env.AZURE_SEARCH_API_KEY;
    
    if (!endpoint || !apiKey) {
      throw new Error('Azure AI Search credentials not configured. Please set AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_API_KEY in your .env file.');
    }

    console.log('Connecting to Azure AI Search...');
    console.log('Endpoint:', endpoint);

    // Create SearchIndexClient
    const indexClient = new SearchIndexClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );

    // Load index schema from JSON file
    const schemaPath = path.join(__dirname, '../../database/azure-search-index-schema.json');
    const indexSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    console.log(`Creating/updating index: ${indexSchema.name}`);

    // Create or update the index
    const result = await indexClient.createOrUpdateIndex(indexSchema);

    console.log('✓ Azure AI Search index created/updated successfully!');
    console.log(`Index name: ${result.name}`);
    console.log(`Fields: ${result.fields.length}`);
    console.log(`Semantic search: ${result.semanticSearch ? 'Enabled' : 'Disabled'}`);
    
    return result;

  } catch (error) {
    console.error('✗ Failed to create Azure AI Search index:');
    console.error(error.message);
    
    if (error.statusCode === 401) {
      console.error('\nAuthentication failed. Please check your AZURE_SEARCH_API_KEY.');
    } else if (error.statusCode === 404) {
      console.error('\nSearch service not found. Please check your AZURE_SEARCH_ENDPOINT.');
    }
    
    throw error;
  }
}

/**
 * Get index information
 */
async function getIndexInfo() {
  try {
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const apiKey = process.env.AZURE_SEARCH_API_KEY;
    
    if (!endpoint || !apiKey) {
      throw new Error('Azure AI Search credentials not configured.');
    }

    const indexClient = new SearchIndexClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );

    const indexName = 'turkiyeai-resorts';
    const index = await indexClient.getIndex(indexName);

    console.log('\n=== Index Information ===');
    console.log(`Name: ${index.name}`);
    console.log(`Fields: ${index.fields.length}`);
    console.log(`\nField Details:`);
    
    index.fields.forEach(field => {
      const props = [];
      if (field.searchable) props.push('searchable');
      if (field.filterable) props.push('filterable');
      if (field.sortable) props.push('sortable');
      if (field.facetable) props.push('facetable');
      
      console.log(`  - ${field.name} (${field.type}): ${props.join(', ')}`);
    });

    return index;

  } catch (error) {
    if (error.statusCode === 404) {
      console.log('\nIndex does not exist yet. Run createSearchIndex() to create it.');
    } else {
      console.error('Error getting index info:', error.message);
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  
  const command = process.argv[2] || 'create';
  
  if (command === 'create') {
    createSearchIndex()
      .then(() => {
        console.log('\n✓ Done!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n✗ Failed!');
        process.exit(1);
      });
  } else if (command === 'info') {
    getIndexInfo()
      .then(() => {
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  } else {
    console.log('Usage: node createSearchIndex.js [create|info]');
    process.exit(1);
  }
}

module.exports = {
  createSearchIndex,
  getIndexInfo
};
