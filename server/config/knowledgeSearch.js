const { SearchClient, SearchIndexClient, AzureKeyCredential } = require('@azure/search-documents');

const KNOWLEDGE_INDEX_NAME = process.env.AZURE_KNOWLEDGE_INDEX_NAME || 'turkeyai-knowledge-index';

let knowledgeSearchClient = null;
let knowledgeIndexClient = null;

/**
 * Get Azure AI Search client for the knowledge index
 */
function getKnowledgeSearchClient() {
  if (!knowledgeSearchClient) {
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const apiKey = process.env.AZURE_SEARCH_API_KEY;

    if (!endpoint || !apiKey) {
      throw new Error('Azure AI Search credentials not configured');
    }

    knowledgeSearchClient = new SearchClient(
      endpoint,
      KNOWLEDGE_INDEX_NAME,
      new AzureKeyCredential(apiKey)
    );
  }

  return knowledgeSearchClient;
}

/**
 * Get Azure SearchIndexClient for creating/managing the knowledge index
 */
function getKnowledgeIndexClient() {
  if (!knowledgeIndexClient) {
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const apiKey = process.env.AZURE_SEARCH_API_KEY;

    if (!endpoint || !apiKey) {
      throw new Error('Azure AI Search credentials not configured');
    }

    knowledgeIndexClient = new SearchIndexClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );
  }

  return knowledgeIndexClient;
}

/**
 * Define the knowledge index schema
 */
const KNOWLEDGE_INDEX_SCHEMA = {
  name: KNOWLEDGE_INDEX_NAME,
  fields: [
    { name: 'id', type: 'Edm.String', key: true, filterable: true },
    { name: 'title', type: 'Edm.String', searchable: true, filterable: false, sortable: true },
    { name: 'content', type: 'Edm.String', searchable: true, filterable: false },
    { name: 'source_type', type: 'Edm.String', searchable: false, filterable: true, facetable: true },
    { name: 'source_url', type: 'Edm.String', searchable: false, filterable: false },
    { name: 'original_filename', type: 'Edm.String', searchable: false, filterable: false },
    {
      name: 'location_tags',
      type: 'Collection(Edm.String)',
      searchable: true,
      filterable: true,
      facetable: true
    },
    { name: 'content_category', type: 'Edm.String', searchable: false, filterable: true, facetable: true },
    { name: 'created_at', type: 'Edm.DateTimeOffset', sortable: true, filterable: true }
  ],
  semanticSearch: {
    configurations: [
      {
        name: 'knowledge-semantic-config',
        prioritizedFields: {
          titleField: { fieldName: 'title' },
          contentFields: [{ fieldName: 'content' }],
          keywordsFields: [{ fieldName: 'location_tags' }]
        }
      }
    ]
  }
};

/**
 * Create or update the knowledge search index in Azure AI Search
 */
async function createKnowledgeIndex() {
  const indexClient = getKnowledgeIndexClient();
  const result = await indexClient.createOrUpdateIndex(KNOWLEDGE_INDEX_SCHEMA);
  return result;
}

/**
 * Index a single knowledge item into Azure AI Search
 * @param {Object} item - Knowledge item to index
 */
async function indexKnowledgeItem(item) {
  const client = getKnowledgeSearchClient();

  const document = {
    id: item.id,
    title: item.title,
    content: item.content,
    source_type: item.source_type,
    source_url: item.source_url || null,
    original_filename: item.original_filename || null,
    location_tags: item.location_tags || [],
    content_category: item.content_category || 'general',
    created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString()
  };

  const result = await client.uploadDocuments([document]);
  return result;
}

/**
 * Remove a knowledge item from Azure AI Search
 * @param {string} id - ID of the knowledge item to remove
 */
async function deleteKnowledgeItem(id) {
  const client = getKnowledgeSearchClient();
  const result = await client.deleteDocuments([{ id }]);
  return result;
}

/**
 * Search the knowledge index
 * @param {string} query - Search query
 * @param {Object} options - Search options (location_tag, source_type, top)
 */
async function searchKnowledge(query, options = {}) {
  const client = getKnowledgeSearchClient();
  const { location_tag, source_type, top = 5 } = options;

  const searchOptions = {
    top,
    select: ['id', 'title', 'content', 'source_type', 'source_url', 'location_tags', 'content_category', 'created_at'],
    queryType: 'semantic',
    semanticConfiguration: 'knowledge-semantic-config',
    includeTotalCount: true
  };

  const filterClauses = [];
  if (location_tag) {
    const escaped = location_tag.replace(/'/g, "''");
    filterClauses.push(`location_tags/any(t: t eq '${escaped}')`);
  }
  if (source_type) {
    const escaped = source_type.replace(/'/g, "''");
    filterClauses.push(`source_type eq '${escaped}'`);
  }
  if (filterClauses.length > 0) {
    searchOptions.filter = filterClauses.join(' and ');
  }

  const searchResults = await client.search(query, searchOptions);

  const results = [];
  for await (const result of searchResults.results) {
    results.push({
      ...result.document,
      score: result.score
    });
  }

  return results;
}

module.exports = {
  getKnowledgeSearchClient,
  getKnowledgeIndexClient,
  KNOWLEDGE_INDEX_NAME,
  KNOWLEDGE_INDEX_SCHEMA,
  createKnowledgeIndex,
  indexKnowledgeItem,
  deleteKnowledgeItem,
  searchKnowledge
};
