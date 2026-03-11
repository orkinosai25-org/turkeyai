/**
 * Create Azure AI Search index for TürkiyeAI knowledge items
 * Usage: node config/createKnowledgeIndex.js [create|info|delete]
 */

const path = require('path');

// Load environment variables before importing search config
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { loadAppSettings } = require('./appSettings');
loadAppSettings();

const { getKnowledgeIndexClient, KNOWLEDGE_INDEX_NAME, KNOWLEDGE_INDEX_SCHEMA } = require('./knowledgeSearch');

async function createKnowledgeIndex() {
  try {
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const apiKey = process.env.AZURE_SEARCH_API_KEY;

    if (!endpoint || !apiKey) {
      throw new Error(
        'Azure AI Search credentials not configured. ' +
        'Please set AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_API_KEY in your .env file.'
      );
    }

    console.log('Connecting to Azure AI Search...');
    console.log('Endpoint:', endpoint);
    console.log('Index name:', KNOWLEDGE_INDEX_NAME);

    const indexClient = getKnowledgeIndexClient();

    console.log(`Creating/updating knowledge index: ${KNOWLEDGE_INDEX_NAME}`);
    const result = await indexClient.createOrUpdateIndex(KNOWLEDGE_INDEX_SCHEMA);

    console.log('✓ Knowledge index created/updated successfully!');
    console.log(`  Index name: ${result.name}`);
    console.log(`  Fields: ${result.fields.length}`);
    console.log(`  Semantic search: ${result.semanticSearch ? 'Enabled' : 'Disabled'}`);

    return result;
  } catch (error) {
    console.error('✗ Failed to create knowledge index:', error.message);
    if (error.statusCode === 401) {
      console.error('  Authentication failed. Please check your AZURE_SEARCH_API_KEY.');
    } else if (error.statusCode === 404) {
      console.error('  Search service not found. Please check your AZURE_SEARCH_ENDPOINT.');
    }
    throw error;
  }
}

async function getIndexInfo() {
  try {
    const indexClient = getKnowledgeIndexClient();
    const index = await indexClient.getIndex(KNOWLEDGE_INDEX_NAME);

    console.log('\n=== Knowledge Index Information ===');
    console.log(`Name: ${index.name}`);
    console.log(`Fields: ${index.fields.length}`);
    console.log('\nField Details:');
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
      console.log('\nKnowledge index does not exist yet. Run with "create" to create it.');
    } else {
      console.error('Error getting index info:', error.message);
    }
    throw error;
  }
}

async function deleteIndex() {
  try {
    const indexClient = getKnowledgeIndexClient();
    await indexClient.deleteIndex(KNOWLEDGE_INDEX_NAME);
    console.log(`✓ Knowledge index "${KNOWLEDGE_INDEX_NAME}" deleted successfully.`);
  } catch (error) {
    if (error.statusCode === 404) {
      console.log('Index does not exist, nothing to delete.');
    } else {
      console.error('Error deleting index:', error.message);
      throw error;
    }
  }
}

if (require.main === module) {
  const command = process.argv[2] || 'create';

  const handlers = {
    create: createKnowledgeIndex,
    info: getIndexInfo,
    delete: deleteIndex
  };

  if (!handlers[command]) {
    console.log('Usage: node createKnowledgeIndex.js [create|info|delete]');
    process.exit(1);
  }

  handlers[command]()
    .then(() => {
      console.log('\n✓ Done!');
      process.exit(0);
    })
    .catch(() => {
      console.error('\n✗ Failed!');
      process.exit(1);
    });
}

module.exports = { createKnowledgeIndex, getIndexInfo, deleteIndex };
